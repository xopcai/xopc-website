import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { once } from "node:events";
import { Readable } from "node:stream";

const UPSTREAM_TIMEOUT_MS = 30 * 60_000;
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

const MODEL_REVISIONS = new Map([
  ["onnx-community/whisper-tiny", "ff4177021cc41f7db950912b73ea4fdf7d01d8e7"],
  ["onnx-community/whisper-base", "1846881b6b3a3024392c1eea3ad983695bc23925"],
  ["onnx-community/whisper-small", "36050c46d777d46dc4b5f43f6d90574fc38f8732"],
]);
const ALLOWED_MODEL_FILES = new Set([
  "config.json",
  "generation_config.json",
  "preprocessor_config.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "special_tokens_map.json",
  "added_tokens.json",
  "vocab.json",
  "merges.txt",
  "onnx/encoder_model_quantized.onnx",
  "onnx/decoder_model_merged_quantized.onnx",
]);

export interface VoiceModelFile {
  repository: string;
  revision: string;
  filePath: string;
}

class VoiceModelDownloadError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function parseVoiceModelPath(segments: string[]): VoiceModelFile {
  if (segments.length < 5 || segments[2] !== "resolve") {
    throw new VoiceModelDownloadError("voice_model_not_found", 404);
  }
  const repository = `${segments[0]}/${segments[1]}`;
  const revision = segments[3] ?? "";
  const fileSegments = segments.slice(4);
  const filePath = fileSegments.join("/");
  if (
    MODEL_REVISIONS.get(repository) !== revision
    || !filePath
    || !ALLOWED_MODEL_FILES.has(filePath)
    || fileSegments.some((part) => !part || part === "." || part === ".." || !/^[a-zA-Z0-9._-]+$/.test(part))
  ) {
    throw new VoiceModelDownloadError("voice_model_not_found", 404);
  }
  return { repository, revision, filePath };
}

function cacheRoot(): string | null {
  const raw = process.env.VOICE_MODEL_CACHE_DIR;
  if (raw === "") return null;
  if (raw?.trim()) return path.resolve(raw.trim());
  return path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "voice-model-cache");
}

function cacheFile(model: VoiceModelFile): string | null {
  const root = cacheRoot();
  return root ? path.join(root, model.repository, model.revision, ...model.filePath.split("/")) : null;
}

function upstreamBases(): string[] {
  const configured = process.env.VOICE_MODEL_UPSTREAM_BASE_URLS
    ?.split(",")
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean) ?? [];
  return [...new Set([...configured, "https://huggingface.co"])];
}

function upstreamHeaders(request: Request): Headers {
  const headers = new Headers({ "User-Agent": "xopc-voice-model-proxy/1" });
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);
  const token = process.env.HF_TOKEN?.trim();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function fetchUpstream(request: Request, model: VoiceModelFile): Promise<Response> {
  let lastError: Error | undefined;
  for (const base of upstreamBases()) {
    const url = `${base}/${model.repository}/resolve/${model.revision}/${model.filePath}`;
    try {
      const response = await fetch(url, {
        headers: upstreamHeaders(request),
        redirect: "follow",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        cache: "no-store",
      });
      if ((response.ok || response.status === 206) && response.body) return response;
      if (response.status === 404) throw new VoiceModelDownloadError("voice_model_file_not_found", 404);
      throw new Error(`voice model upstream returned ${response.status}`);
    } catch (error) {
      if (error instanceof VoiceModelDownloadError) throw error;
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw new VoiceModelDownloadError(lastError?.message ?? "voice_model_upstream_failed", 502);
}

function responseHeaders(source: Headers): Headers {
  const headers = new Headers({
    "Content-Type": source.get("content-type") || "application/octet-stream",
    "Cache-Control": IMMUTABLE_CACHE_CONTROL,
    "Accept-Ranges": source.get("accept-ranges") || "bytes",
    "X-Content-Type-Options": "nosniff",
    "X-Accel-Buffering": "no",
  });
  for (const name of ["content-length", "content-range", "etag", "last-modified"]) {
    const value = source.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function parseRange(value: string | null, size: number): { start: number; end: number } | null {
  if (!value) return null;
  const match = value.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;
  const rawStart = match[1];
  const rawEnd = match[2];
  if (!rawStart && !rawEnd) return null;
  const start = rawStart ? Number(rawStart) : Math.max(0, size - Number(rawEnd));
  const end = rawEnd && rawStart ? Number(rawEnd) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

async function cachedResponse(request: Request, file: string): Promise<Response | null> {
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return null;
  const range = parseRange(request.headers.get("range"), info.size);
  const headers = new Headers({
    "Content-Type": "application/octet-stream",
    "Cache-Control": IMMUTABLE_CACHE_CONTROL,
    "Accept-Ranges": "bytes",
    "X-Accel-Buffering": "no",
  });
  if (range) {
    headers.set("Content-Length", String(range.end - range.start + 1));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${info.size}`);
  } else {
    headers.set("Content-Length", String(info.size));
  }
  if (request.method === "HEAD") return new Response(null, { status: range ? 206 : 200, headers });
  const stream = createReadStream(file, range ? { start: range.start, end: range.end } : undefined);
  const body = Readable.toWeb(stream) as ReadableStream<Uint8Array>;
  return new Response(body, { status: range ? 206 : 200, headers });
}

async function acquireCacheLock(file: string): Promise<(() => Promise<void>) | null> {
  const lock = `${file}.lock`;
  await mkdir(path.dirname(file), { recursive: true });
  try {
    const handle = await open(lock, "wx");
    await handle.writeFile(`${process.pid}\n`);
    await handle.close();
    return () => unlink(lock).catch(() => {});
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return null;
    throw error;
  }
}

function streamAndCache(
  upstream: Response,
  file: string,
  releaseLock: () => Promise<void>,
): ReadableStream<Uint8Array> {
  const reader = upstream.body!.getReader();
  const part = `${file}.part-${process.pid}-${Date.now()}`;
  const output = createWriteStream(part, { flags: "wx" });
  let completed = false;

  const cleanup = async () => {
    if (!completed) await unlink(part).catch(() => {});
    await releaseLock();
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await reader.read();
        if (chunk.done) {
          const closed = once(output, "close");
          output.end();
          await closed;
          await rename(part, file);
          completed = true;
          await cleanup();
          controller.close();
          return;
        }
        if (!output.write(chunk.value)) await once(output, "drain");
        controller.enqueue(chunk.value);
      } catch (error) {
        output.destroy();
        await cleanup();
        controller.error(error);
      }
    },
    async cancel(reason) {
      output.destroy();
      await reader.cancel(reason).catch(() => {});
      await cleanup();
    },
  });
}

export async function serveVoiceModelFile(request: Request, segments: string[]): Promise<Response> {
  const model = parseVoiceModelPath(segments);
  const file = cacheFile(model);
  if (file) {
    const cached = await cachedResponse(request, file);
    if (cached) return cached;
  }

  const upstream = await fetchUpstream(request, model);
  const headers = responseHeaders(upstream.headers);
  if (request.method === "HEAD") return new Response(null, { status: upstream.status, headers });

  if (!file || request.headers.has("range")) {
    return new Response(upstream.body, { status: upstream.status, headers });
  }
  const releaseLock = await acquireCacheLock(file);
  if (!releaseLock) {
    return new Response(upstream.body, { status: upstream.status, headers });
  }
  return new Response(streamAndCache(upstream, file, releaseLock), {
    status: upstream.status,
    headers,
  });
}

export function voiceModelErrorResponse(error: unknown): Response {
  const status = error instanceof VoiceModelDownloadError ? error.status : 500;
  return Response.json(
    { error: status === 404 ? "not_found" : status === 502 ? "upstream_unavailable" : "server_error" },
    { status },
  );
}
