import { createReadStream, createWriteStream, statSync } from "node:fs";
import { mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

/** Keep in sync with xopc `src/browser/providers/cloakbrowser.ts` PLATFORMS. */
export type CloakBrowserPlatformManifest = {
  tag: string;
  chromiumVersion: string;
  archiveExt: ".tar.gz" | ".zip";
};

export const CLOAKBROWSER_PLATFORMS: Record<string, CloakBrowserPlatformManifest> = {
  "darwin-arm64": {
    tag: "darwin-arm64",
    chromiumVersion: "145.0.7632.109.2",
    archiveExt: ".tar.gz",
  },
  "darwin-x64": {
    tag: "darwin-x64",
    chromiumVersion: "145.0.7632.109.2",
    archiveExt: ".tar.gz",
  },
  "linux-arm64": {
    tag: "linux-arm64",
    chromiumVersion: "146.0.7680.177.4",
    archiveExt: ".tar.gz",
  },
  "linux-x64": {
    tag: "linux-x64",
    chromiumVersion: "146.0.7680.177.4",
    archiveExt: ".tar.gz",
  },
  "windows-x64": {
    tag: "windows-x64",
    chromiumVersion: "146.0.7680.177.4",
    archiveExt: ".zip",
  },
};

const GITHUB_DOWNLOAD_BASE_URL =
  "https://github.com/CloakHQ/CloakBrowser/releases/download";
const CLOAKBROWSER_DEV_BASE_URL = "https://cloakbrowser.dev/download";

const UA = "xopc-website-cloakbrowser-proxy";
const LOCK_WAIT_MS = 900_000;
const LOCK_POLL_MS = 400;
const STALE_LOCK_MS = 30 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 900_000;

const ARCHIVE_NAME_RE =
  /^cloakbrowser-(darwin-arm64|darwin-x64|linux-arm64|linux-x64|windows-x64)\.(tar\.gz|zip)$/;

export function assertAllowedCloakBrowserArchiveName(name: string): void {
  if (!name || name.length > 120) throw new Error("invalid name");
  if (/[/\\]/.test(name) || name.includes("..")) throw new Error("invalid name");
  if (!ARCHIVE_NAME_RE.test(name)) throw new Error("invalid name");
}

function manifestForArchiveName(name: string): CloakBrowserPlatformManifest {
  assertAllowedCloakBrowserArchiveName(name);
  const m = name.match(ARCHIVE_NAME_RE);
  if (!m) throw new Error("invalid name");
  const tag = m[1];
  const info = CLOAKBROWSER_PLATFORMS[tag];
  if (!info) throw new Error("invalid name");
  const expected = `cloakbrowser-${info.tag}${info.archiveExt}`;
  if (name !== expected) throw new Error("invalid name");
  return info;
}

/** Upstream URLs tried in order when filling the xopc.ai cache. */
export function upstreamUrlsForArchive(name: string): string[] {
  const info = manifestForArchiveName(name);
  const archiveName = `cloakbrowser-${info.tag}${info.archiveExt}`;
  return [
    `${GITHUB_DOWNLOAD_BASE_URL}/chromium-v${info.chromiumVersion}/${archiveName}`,
    `${CLOAKBROWSER_DEV_BASE_URL}/${archiveName}`,
  ];
}

export function getCloakBrowserCacheRoot(): string | null {
  const raw = process.env.CLOAKBROWSER_CACHE_DIR;
  if (raw === "") return null;
  if (raw?.trim()) return path.resolve(raw.trim());
  return path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "cloakbrowser-cache");
}

function upstreamHeaders(): Record<string, string> {
  return { "User-Agent": UA };
}

function contentDispositionAttachment(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

async function statSafe(p: string): Promise<import("node:fs").Stats | null> {
  try {
    return await stat(p);
  } catch {
    return null;
  }
}

function cacheFilePath(name: string): string {
  const root = getCloakBrowserCacheRoot();
  if (!root) throw new Error("cache disabled");
  return path.join(root, name);
}

function lockPathFor(finalPath: string): string {
  return `${finalPath}.lock`;
}

async function waitUntilCachedOrAcquireLock(finalPath: string): Promise<"cached" | "locked"> {
  const lock = lockPathFor(finalPath);
  await mkdir(path.dirname(finalPath), { recursive: true });
  const deadline = Date.now() + LOCK_WAIT_MS;

  while (Date.now() < deadline) {
    if (await statSafe(finalPath)) return "cached";

    const lockSt = await statSafe(lock);
    if (lockSt && Date.now() - lockSt.mtimeMs > STALE_LOCK_MS) {
      await unlink(lock).catch(() => {});
      continue;
    }

    try {
      await writeFile(lock, `${process.pid}\n`, { flag: "wx" });
      if (await statSafe(finalPath)) {
        await unlink(lock).catch(() => {});
        return "cached";
      }
      return "locked";
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== "EEXIST") throw e;
    }

    await new Promise((r) => setTimeout(r, LOCK_POLL_MS));
  }

  throw new Error("cloakbrowser_download_lock_timeout");
}

async function downloadUpstreamToFile(url: string, finalPath: string): Promise<void> {
  const partPath = `${finalPath}.part`;
  const res = await fetch(url, {
    headers: upstreamHeaders(),
    redirect: "follow",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!res.ok || !res.body) {
    throw new Error(`upstream ${url} returned ${res.status}`);
  }
  try {
    await pipeline(
      Readable.fromWeb(res.body as import("stream/web").ReadableStream),
      createWriteStream(partPath),
    );
    await rename(partPath, finalPath);
  } catch (e) {
    await unlink(partPath).catch(() => {});
    throw e;
  }
}

async function ensureCachedArchive(name: string): Promise<string | null> {
  const root = getCloakBrowserCacheRoot();
  if (!root) return null;

  const finalPath = cacheFilePath(name);
  if (await statSafe(finalPath)) return finalPath;

  const state = await waitUntilCachedOrAcquireLock(finalPath);
  if (state === "cached" || (await statSafe(finalPath))) return finalPath;

  const lock = lockPathFor(finalPath);
  try {
    let lastError: Error | undefined;
    for (const url of upstreamUrlsForArchive(name)) {
      try {
        await downloadUpstreamToFile(url, finalPath);
        return finalPath;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        await unlink(finalPath).catch(() => {});
      }
    }
    throw lastError ?? new Error("all upstream URLs failed");
  } finally {
    await unlink(lock).catch(() => {});
  }
}

function fileResponse(finalPath: string, name: string): Response {
  const s = statSync(finalPath);
  const body = Readable.toWeb(createReadStream(finalPath)) as ReadableStream<Uint8Array>;
  const contentType = name.endsWith(".zip")
    ? "application/zip"
    : "application/gzip";
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(s.size),
      "Content-Disposition": contentDispositionAttachment(name),
      "Cache-Control": "public, max-age=86400",
    },
  });
}

async function streamFromUpstream(name: string): Promise<Response> {
  let lastError: Error | undefined;
  for (const url of upstreamUrlsForArchive(name)) {
    try {
      const res = await fetch(url, {
        headers: upstreamHeaders(),
        redirect: "follow",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
      if (!res.ok || !res.body) {
        throw new Error(`upstream ${url} returned ${res.status}`);
      }
      const contentType = name.endsWith(".zip")
        ? "application/zip"
        : res.headers.get("content-type")?.trim() || "application/gzip";
      const contentLength = res.headers.get("content-length");
      return new Response(res.body, {
        headers: {
          "Content-Type": contentType,
          ...(contentLength ? { "Content-Length": contentLength } : {}),
          "Content-Disposition": contentDispositionAttachment(name),
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error("all upstream URLs failed");
}

/**
 * Serve CloakBrowser archive via xopc.ai: disk cache when enabled, else stream from upstream.
 * Always proxies through this origin (no 307 to GitHub) so clients in restricted networks can download.
 */
export async function serveCloakBrowserDownload(name: string): Promise<Response> {
  assertAllowedCloakBrowserArchiveName(name);

  const cached = await ensureCachedArchive(name).catch(() => null);
  if (cached) {
    return fileResponse(cached, name);
  }

  return streamFromUpstream(name);
}

/** Optional warmup: fetch all platform archives into disk cache. */
export async function prefetchCloakBrowserArchives(): Promise<void> {
  if (process.env.DISABLE_CLOAKBROWSER_PREFETCH?.trim() === "1") return;
  for (const info of Object.values(CLOAKBROWSER_PLATFORMS)) {
    const name = `cloakbrowser-${info.tag}${info.archiveExt}`;
    try {
      await ensureCachedArchive(name);
    } catch {
      /* best effort */
    }
  }
}
