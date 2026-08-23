import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const CACHE_CONTROL = "public, max-age=31536000, immutable";
const MAX_ARCHIVE_BYTES = 500 * 1024 * 1024;
const MAX_CHECKSUM_BYTES = 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 30 * 60_000;
const LOCK_WAIT_MS = 15 * 60_000;
const LOCK_POLL_MS = 400;
const STALE_LOCK_MS = UPSTREAM_TIMEOUT_MS + 5 * 60_000;
const ALLOWED_UPSTREAM_HOSTS = new Set([
  "nodejs.org",
  "github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
]);

export const RUNTIME_VERSIONS = {
  node: "22.23.2",
  uv: "0.8.12",
} as const;

export const RUNTIME_PLATFORMS = [
  "darwin-arm64",
  "darwin-x64",
  "win32-x64",
  "linux-x64-gnu",
  "linux-arm64-gnu",
] as const;

export type RuntimeDownloadKind = keyof typeof RUNTIME_VERSIONS;
export type RuntimeDownloadPlatform = (typeof RUNTIME_PLATFORMS)[number];

export interface RuntimeDownloadAsset {
  runtime: RuntimeDownloadKind;
  version: string;
  platform: RuntimeDownloadPlatform;
  filename: string;
  archiveType: "zip" | "tar.gz";
  upstreamUrl: string;
  checksumUrl: string;
}

interface VerifiedArtifact {
  cacheNamespace: string;
  version: string;
  platform: string;
  filename: string;
  upstreamUrl: string;
}

/** Generated from uv 0.8.12 download-metadata.json; keep aligned with xopc's pinned uv. */
const PYTHON_BUILD_STANDALONE_ASSETS = [
  {
    platform: "darwin-arm64",
    filename: "cpython-3.12.11+20250818-aarch64-apple-darwin-install_only_stripped.tar.gz",
    sha256: "bbf0c85d09a8173e50d18a0198f14d1de91eab17a593ccf9445f214fb0555547",
  },
  {
    platform: "darwin-x64",
    filename: "cpython-3.12.11+20250818-x86_64-apple-darwin-install_only_stripped.tar.gz",
    sha256: "296af6b9dd16f16dca2503a9a1cfc8593e4cd79ed19ee20cb2557da0912cf6b2",
  },
  {
    platform: "linux-arm64-gnu",
    filename: "cpython-3.12.11+20250818-aarch64-unknown-linux-gnu-install_only_stripped.tar.gz",
    sha256: "f3dbedb0819ddd8c16f6f3cc9671874a9a35342d7d3d7ba6ecbaa5ed655259ef",
  },
  {
    platform: "linux-x64-gnu",
    filename: "cpython-3.12.11+20250818-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz",
    sha256: "b5a4f189f25cbacba0f76c9bd6f3ea8c35d2064068aa74ccbb6863068caababd",
  },
  {
    platform: "win32-x64",
    filename: "cpython-3.12.11+20250818-x86_64-pc-windows-msvc-install_only_stripped.tar.gz",
    sha256: "9624883ba5ad269282028e17db800f7ddfa8f57007742a868c2acab0eb3c91c2",
  },
] as const;

const PYTHON_RELEASE = "20250818";
const PYTHON_ASSET_BY_PATH = new Map(PYTHON_BUILD_STANDALONE_ASSETS.map((asset) => [
  `${PYTHON_RELEASE}/${asset.filename}`,
  asset,
]));

export class RuntimeDownloadError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message = code,
  ) {
    super(message);
  }
}

function isRuntime(value: string): value is RuntimeDownloadKind {
  return value === "node" || value === "uv";
}

function isPlatform(value: string): value is RuntimeDownloadPlatform {
  return (RUNTIME_PLATFORMS as readonly string[]).includes(value);
}

function nodeSuffix(platform: RuntimeDownloadPlatform): string {
  return {
    "darwin-arm64": "darwin-arm64",
    "darwin-x64": "darwin-x64",
    "win32-x64": "win-x64",
    "linux-x64-gnu": "linux-x64",
    "linux-arm64-gnu": "linux-arm64",
  }[platform];
}

function uvSuffix(platform: RuntimeDownloadPlatform): string {
  return {
    "darwin-arm64": "aarch64-apple-darwin",
    "darwin-x64": "x86_64-apple-darwin",
    "win32-x64": "x86_64-pc-windows-msvc",
    "linux-x64-gnu": "x86_64-unknown-linux-gnu",
    "linux-arm64-gnu": "aarch64-unknown-linux-gnu",
  }[platform];
}

export function resolveRuntimeDownloadAsset(
  runtimeValue: string,
  version: string,
  platformValue: string,
): RuntimeDownloadAsset {
  if (!isRuntime(runtimeValue) || !isPlatform(platformValue)) {
    throw new RuntimeDownloadError("unsupported_catalog_entry", 404);
  }
  if (version !== RUNTIME_VERSIONS[runtimeValue]) {
    throw new RuntimeDownloadError("unsupported_catalog_entry", 404);
  }

  if (runtimeValue === "node") {
    const archiveType = platformValue === "win32-x64" ? "zip" : "tar.gz";
    const filename = `node-v${version}-${nodeSuffix(platformValue)}.${archiveType}`;
    const releaseBase = `https://nodejs.org/download/release/v${version}`;
    return {
      runtime: runtimeValue,
      version,
      platform: platformValue,
      filename,
      archiveType,
      upstreamUrl: `${releaseBase}/${filename}`,
      checksumUrl: `${releaseBase}/SHASUMS256.txt`,
    };
  }

  const archiveType = platformValue === "win32-x64" ? "zip" : "tar.gz";
  const filename = `uv-${uvSuffix(platformValue)}.${archiveType}`;
  const releaseBase = `https://github.com/astral-sh/uv/releases/download/${version}`;
  return {
    runtime: runtimeValue,
    version,
    platform: platformValue,
    filename,
    archiveType,
    upstreamUrl: `${releaseBase}/${filename}`,
    checksumUrl: `${releaseBase}/${filename}.sha256`,
  };
}

export function assertRuntimeDownloadFilename(asset: RuntimeDownloadAsset, filename: string): void {
  if (filename !== asset.filename || filename.includes("..") || /[/\\]/.test(filename)) {
    throw new RuntimeDownloadError("artifact_not_found", 404);
  }
}

export function runtimeDownloadCacheRoot(): string | null {
  const configured = process.env.RUNTIME_DOWNLOAD_CACHE_DIR;
  if (configured === "") return null;
  if (configured?.trim()) return path.resolve(configured.trim());
  return path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "runtime-cache");
}

function assertAllowedUpstream(url: URL): void {
  if (url.protocol !== "https:" || !ALLOWED_UPSTREAM_HOSTS.has(url.hostname)) {
    throw new RuntimeDownloadError("upstream_not_allowed", 502);
  }
}

async function fetchAllowed(url: string, method: "GET" | "HEAD" = "GET"): Promise<Response> {
  let current = new URL(url);
  try {
    for (let redirects = 0; redirects <= 5; redirects += 1) {
      assertAllowedUpstream(current);
      const response = await fetch(current, {
        method,
        headers: { "User-Agent": "xopc-runtime-artifact-gateway/1" },
        redirect: "manual",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        cache: "no-store",
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) return response;
      const location = response.headers.get("location");
      await response.body?.cancel().catch(() => {});
      if (!location) throw new RuntimeDownloadError("invalid_upstream_redirect", 502);
      current = new URL(location, current);
    }
  } catch (error) {
    if (error instanceof RuntimeDownloadError) throw error;
    throw new RuntimeDownloadError("upstream_unavailable", 502);
  }
  throw new RuntimeDownloadError("too_many_upstream_redirects", 502);
}

async function readValidChecksum(file: string): Promise<string | null> {
  try {
    const value = (await readFile(file, "utf8")).trim().toLowerCase();
    return /^[a-f0-9]{64}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

async function readResponseText(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new RuntimeDownloadError("response_too_large", 502);
      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
  return Buffer.concat(chunks, bytes).toString("utf8");
}

function checksumCachePath(root: string, asset: RuntimeDownloadAsset): string {
  return path.join(root, "_checksums", asset.runtime, asset.version, `${asset.filename}.sha256`);
}

function parseChecksum(text: string, asset: RuntimeDownloadAsset): string {
  for (const line of text.split(/\r?\n/)) {
    const match = line.trim().match(/^([a-fA-F0-9]{64})(?:\s+[*]?(.+))?$/);
    if (match && (!match[2] || match[2] === asset.filename)) return match[1]!.toLowerCase();
  }
  throw new RuntimeDownloadError("checksum_not_found", 502);
}

export async function resolveRuntimeDownloadChecksum(asset: RuntimeDownloadAsset): Promise<string> {
  const root = runtimeDownloadCacheRoot();
  const cacheFile = root ? checksumCachePath(root, asset) : null;
  if (cacheFile) {
    const cached = await readValidChecksum(cacheFile);
    if (cached) return cached;
  }

  const response = await fetchAllowed(asset.checksumUrl);
  if (!response.ok || !response.body) {
    throw new RuntimeDownloadError("checksum_upstream_unavailable", 502);
  }
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_CHECKSUM_BYTES) {
    throw new RuntimeDownloadError("checksum_response_too_large", 502);
  }
  const text = await readResponseText(response, MAX_CHECKSUM_BYTES);
  const checksum = parseChecksum(text, asset);
  if (cacheFile) {
    await mkdir(path.dirname(cacheFile), { recursive: true });
    const part = `${cacheFile}.part-${process.pid}-${Date.now()}`;
    await writeFile(part, `${checksum}\n`, { flag: "wx" });
    await rename(part, cacheFile).catch(async (error) => {
      await unlink(part).catch(() => {});
      if (!(await readValidChecksum(cacheFile))) throw error;
    });
  }
  return checksum;
}

function artifactCachePath(root: string, asset: VerifiedArtifact, sha256: string): string {
  return path.join(root, asset.cacheNamespace, asset.version, asset.platform, sha256, asset.filename);
}

async function statFile(file: string) {
  const info = await stat(file).catch(() => null);
  return info?.isFile() ? info : null;
}

async function waitUntilCachedOrAcquireLock(finalPath: string): Promise<"cached" | "locked"> {
  const lockPath = `${finalPath}.lock`;
  await mkdir(path.dirname(finalPath), { recursive: true });
  const deadline = Date.now() + LOCK_WAIT_MS;
  while (Date.now() < deadline) {
    if (await statFile(finalPath)) return "cached";
    const lock = await stat(lockPath).catch(() => null);
    if (lock && Date.now() - lock.mtimeMs > STALE_LOCK_MS) {
      await unlink(lockPath).catch(() => {});
      continue;
    }
    try {
      await writeFile(lockPath, `${process.pid}\n`, { flag: "wx" });
      if (await statFile(finalPath)) {
        await unlink(lockPath).catch(() => {});
        return "cached";
      }
      return "locked";
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_MS));
  }
  throw new RuntimeDownloadError("artifact_lock_timeout", 503);
}

async function downloadAndVerify(
  asset: VerifiedArtifact,
  expectedSha256: string,
  finalPath: string,
): Promise<void> {
  const response = await fetchAllowed(asset.upstreamUrl);
  if (!response.ok || !response.body) {
    throw new RuntimeDownloadError("artifact_upstream_unavailable", 502);
  }
  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_ARCHIVE_BYTES) {
    throw new RuntimeDownloadError("artifact_too_large", 502);
  }

  const partPath = `${finalPath}.part-${process.pid}-${Date.now()}`;
  const hash = createHash("sha256");
  let received = 0;
  const verifier = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.byteLength;
      if (received > MAX_ARCHIVE_BYTES) {
        callback(new RuntimeDownloadError("artifact_too_large", 502));
        return;
      }
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  try {
    await pipeline(
      Readable.fromWeb(response.body as import("stream/web").ReadableStream),
      verifier,
      createWriteStream(partPath, { flags: "wx", mode: 0o600 }),
    );
    if (Number.isFinite(declaredSize) && declaredSize > 0 && received !== declaredSize) {
      throw new RuntimeDownloadError("artifact_truncated", 502);
    }
    if (hash.digest("hex") !== expectedSha256) {
      throw new RuntimeDownloadError("artifact_checksum_mismatch", 502);
    }
    await rename(partPath, finalPath);
  } catch (error) {
    await unlink(partPath).catch(() => {});
    throw error;
  }
}

async function ensureVerifiedArtifact(
  asset: VerifiedArtifact,
  expectedSha256: string,
): Promise<string> {
  const root = runtimeDownloadCacheRoot();
  if (!root) throw new RuntimeDownloadError("runtime_cache_disabled", 503);
  const finalPath = artifactCachePath(root, asset, expectedSha256);
  if (await statFile(finalPath)) return finalPath;

  const state = await waitUntilCachedOrAcquireLock(finalPath);
  if (state === "cached") return finalPath;
  const lockPath = `${finalPath}.lock`;
  const startedAt = Date.now();
  try {
    await downloadAndVerify(asset, expectedSha256, finalPath);
    const info = await stat(finalPath);
    console.info("[runtime-download] cache fill completed", {
      runtime: asset.cacheNamespace,
      version: asset.version,
      platform: asset.platform,
      bytes: info.size,
      durationMs: Date.now() - startedAt,
    });
    return finalPath;
  } catch (error) {
    console.error("[runtime-download] cache fill failed", {
      runtime: asset.cacheNamespace,
      version: asset.version,
      platform: asset.platform,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await unlink(lockPath).catch(() => {});
  }
}

type ByteRange = { start: number; end: number };

function parseRange(value: string | null, size: number): ByteRange | null | "invalid" {
  if (!value) return null;
  const match = value.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2])) return "invalid";
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[2] && match[1] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
    return "invalid";
  }
  return { start, end: Math.min(end, size - 1) };
}

function contentType(filename: string): string {
  return filename.endsWith(".zip") ? "application/zip" : "application/gzip";
}

function contentDisposition(filename: string): string {
  return `attachment; filename="${filename}"`;
}

async function serveCachedArtifact(
  request: Request,
  file: string,
  asset: VerifiedArtifact,
  sha256: string,
): Promise<Response> {
  const info = await stat(file);
  const etag = `"sha256-${sha256}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { "Cache-Control": CACHE_CONTROL, ETag: etag },
    });
  }
  const rangeHeader = request.headers.get("range");
  const ifRange = request.headers.get("if-range");
  const range = parseRange(ifRange && ifRange !== etag ? null : rangeHeader, info.size);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": CACHE_CONTROL,
    "Content-Disposition": contentDisposition(asset.filename),
    "Content-Type": contentType(asset.filename),
    "ETag": etag,
    "X-Accel-Buffering": "no",
    "X-Content-Type-Options": "nosniff",
  });
  if (range === "invalid") {
    headers.set("Content-Range", `bytes */${info.size}`);
    return new Response(null, { status: 416, headers });
  }
  if (range) {
    headers.set("Content-Length", String(range.end - range.start + 1));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${info.size}`);
  } else {
    headers.set("Content-Length", String(info.size));
  }
  const status = range ? 206 : 200;
  if (request.method === "HEAD") return new Response(null, { status, headers });
  const stream = createReadStream(file, range ? { start: range.start, end: range.end } : undefined);
  return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { status, headers });
}

export async function resolveRuntimeDownloadDescriptor(
  origin: string,
  runtime: string,
  version: string,
  platform: string,
) {
  const asset = resolveRuntimeDownloadAsset(runtime, version, platform);
  const sha256 = await resolveRuntimeDownloadChecksum(asset);
  const base = origin.replace(/\/+$/, "");
  return {
    schemaVersion: 1,
    runtime: asset.runtime,
    version: asset.version,
    platform: asset.platform,
    archive: {
      name: asset.filename,
      url: `${base}/api/runtime/v1/artifacts/${asset.runtime}/${asset.version}/${asset.platform}/${asset.filename}`,
      sha256,
      archiveType: asset.archiveType,
    },
  };
}

export async function serveRuntimeDownloadArtifact(
  request: Request,
  runtime: string,
  version: string,
  platform: string,
  filename: string,
): Promise<Response> {
  const asset = resolveRuntimeDownloadAsset(runtime, version, platform);
  assertRuntimeDownloadFilename(asset, filename);
  const sha256 = await resolveRuntimeDownloadChecksum(asset);
  const verifiedAsset: VerifiedArtifact = {
    ...asset,
    cacheNamespace: asset.runtime,
  };
  const file = await ensureVerifiedArtifact(verifiedAsset, sha256);
  return await serveCachedArtifact(request, file, verifiedAsset, sha256);
}

export async function servePythonBuildStandalone(
  request: Request,
  release: string,
  filename: string,
): Promise<Response> {
  if (
    !/^\d{8}$/.test(release)
    || !filename
    || filename.includes("..")
    || /[/\\]/.test(filename)
  ) {
    throw new RuntimeDownloadError("artifact_not_found", 404);
  }
  const manifest = PYTHON_ASSET_BY_PATH.get(`${release}/${filename}`);
  if (!manifest) throw new RuntimeDownloadError("artifact_not_found", 404);
  const asset: VerifiedArtifact = {
    cacheNamespace: "python-build-standalone",
    version: "3.12.11",
    platform: manifest.platform,
    filename: manifest.filename,
    upstreamUrl: `https://github.com/astral-sh/python-build-standalone/releases/download/${release}/${encodeURIComponent(filename)}`,
  };
  const file = await ensureVerifiedArtifact(asset, manifest.sha256);
  return await serveCachedArtifact(request, file, asset, manifest.sha256);
}

export function runtimeDownloadErrorResponse(error: unknown): Response {
  const status = error instanceof RuntimeDownloadError ? error.status : 500;
  const code = error instanceof RuntimeDownloadError ? error.code : "server_error";
  return Response.json({ error: code }, {
    status,
    headers: status === 503 ? { "Retry-After": "5" } : undefined,
  });
}
