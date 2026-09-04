import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

/** 与 API route、预热任务共用 */
export const GITHUB_REPO = "xopcai/xopc";

/** electron-updater 公网基址为 `/api/download/<name>` 时需与 GitHub Release 资源名一致 */
export const ELECTRON_UPDATE_MANIFEST_NAMES = [
  "latest.yml",
  "latest-mac.yml",
  "latest-linux.yml",
  "latest-linux-arm64.yml",
] as const;

const ELECTRON_UPDATE_MANIFEST_SET = new Set<string>(ELECTRON_UPDATE_MANIFEST_NAMES);

const SEMVER_PATTERN = String.raw`(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?`;
const XOPC_RELEASE_ASSET_PATTERN = new RegExp(
  `^xopc-(?<version>${SEMVER_PATTERN})-(?:(?:arm64|x64)\\.(?:dmg|zip|exe)|(?:arm64|x86_64)\\.AppImage|(?:arm64|amd64)\\.deb)(?:\\.blockmap)?$`,
);
const DESKTOP_RELEASE_TAG_PATTERN = new RegExp(`^v${SEMVER_PATTERN}$`);
const ANDROID_RELEASE_ASSET_NAME = "xopc-android.apk";
const ANDROID_RELEASE_CHECKSUM_NAME = `${ANDROID_RELEASE_ASSET_NAME}.sha256`;

const UA = "xopc-website-release-cache";
const LOCK_WAIT_MS = 320_000;
const LOCK_POLL_MS = 400;
/** 进程崩溃后残留的 `.lock`；超过该时间则删除并重新抢锁 */
const STALE_LOCK_MS = 30 * 60 * 1000;
/** 从 GitHub 拉取 release 资源（yml / 安装包）的超时 */
function upstreamFetchSignal(name: string): AbortSignal | undefined {
  const ms = isElectronUpdateManifestName(name) ? 60_000 : 900_000;
  return AbortSignal.timeout(ms);
}

export function githubApiHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": UA,
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function upstreamAssetHeaders(): Record<string, string> {
  return { "User-Agent": UA };
}

/**
 * 为 true 时，zip/dmg 等大文件仍经 Node 流式代理（需在 nginx 侧关闭 buffering 等，见部署说明）。
 * 默认 false：对非 `latest-*.yml` 资源返回 307 到 GitHub，避免反向代理截断大响应。
 */
function shouldProxyBinaryThroughOrigin(): boolean {
  const v = process.env.RELEASE_DOWNLOAD_PROXY_BINARIES?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** 空字符串表示禁用本地磁盘缓存（仅透传 GitHub）。 */
export function getReleaseCacheRoot(): string | null {
  const raw = process.env.RELEASE_CACHE_DIR;
  if (raw === "") return null;
  const trimmed = raw?.trim();
  if (trimmed) {
    return path.isAbsolute(trimmed)
      ? trimmed
      : path.join(/* turbopackIgnore: true */ process.cwd(), trimmed);
  }
  return path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "release-cache");
}

export function assertAllowedReleaseTag(tag: string): void {
  if (!tag || tag.length > 80) throw new Error("invalid tag");
  if (!/^[\w.-]+$/.test(tag)) throw new Error("invalid tag");
}

export function assertAllowedReleaseAssetName(name: string): void {
  if (!name || name.length > 220) throw new Error("invalid name");
  if (/[/\\]/.test(name) || name.includes("..")) throw new Error("invalid name");
  if (ELECTRON_UPDATE_MANIFEST_SET.has(name)) return;
  if (name === ANDROID_RELEASE_ASSET_NAME || name === ANDROID_RELEASE_CHECKSUM_NAME) return;
  if (!XOPC_RELEASE_ASSET_PATTERN.test(name)) throw new Error("invalid asset type");
}

export function isAllowedReleaseAssetName(name: string): boolean {
  try {
    assertAllowedReleaseAssetName(name);
    return true;
  } catch {
    return false;
  }
}

export function isElectronUpdateManifestName(name: string): boolean {
  return ELECTRON_UPDATE_MANIFEST_SET.has(name);
}

export function cacheFilePath(tag: string, name: string): string {
  assertAllowedReleaseTag(tag);
  assertAllowedReleaseAssetName(name);
  const root = getReleaseCacheRoot();
  if (!root) throw new Error("cache disabled");
  return path.join(root, tag, name);
}

export async function resolveAssetDownloadUrl(tag: string, name: string): Promise<string | null> {
  assertAllowedReleaseTag(tag);
  assertAllowedReleaseAssetName(name);
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${encodeURIComponent(tag)}`;
  const res = await fetch(url, { headers: githubApiHeaders(), cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { assets?: { name: string; browser_download_url: string }[] };
  const hit = data.assets?.find((a) => a.name === name);
  return hit?.browser_download_url ?? null;
}

/**
 * 当 latest 已指向更高版本时，`/api/download/xopc-0.0.38-arm64.zip` 等带版本号的资源不会在 latest 的 assets 里，
 * 此时从文件名推断 tag 再查对应 release（仍须与 GitHub 资源名完全一致）。
 */
function candidateTagsInferredFromXopcAssetName(name: string): string[] {
  const ver = XOPC_RELEASE_ASSET_PATTERN.exec(name)?.groups?.version;
  if (!ver) return [];
  return [`v${ver}`];
}

export type DesktopRelease = {
  tag: string;
  assets: { name: string; url: string }[];
};

/** 成功拉取后短时间内复用，减轻 GitHub 匿名限流压力 */
const DESKTOP_REFRESH_MS = 60_000;
/** 内存中最近一次成功结果在 GitHub 失败时最多继续用多久 */
const DESKTOP_STALE_MEMORY_MS = 86_400_000;
/** 磁盘快照在 GitHub 失败时最多继续用多久（跨进程重启） */
const DESKTOP_STALE_DISK_MS = 7 * 86_400_000;

let desktopReleaseMemory: { fetchedAt: number; data: DesktopRelease } | null = null;

function desktopReleaseDiskPath(): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "github-desktop-release.json");
}

async function readDesktopReleaseFromDisk(): Promise<{ savedAt: number; data: DesktopRelease } | null> {
  try {
    const raw = await readFile(/* turbopackIgnore: true */ desktopReleaseDiskPath(), "utf8");
    const j = JSON.parse(raw) as {
      savedAt: number;
      tag: string;
      assets: { name: string; url: string }[];
    };
    if (
      typeof j.savedAt !== "number" ||
      !DESKTOP_RELEASE_TAG_PATTERN.test(j.tag) ||
      !Array.isArray(j.assets)
    ) return null;
    const assets = j.assets.filter((asset) => isAllowedReleaseAssetName(asset.name));
    if (!assets.some((asset) => XOPC_RELEASE_ASSET_PATTERN.test(asset.name))) return null;
    return {
      savedAt: j.savedAt,
      data: { tag: j.tag, assets },
    };
  } catch {
    return null;
  }
}

async function writeDesktopReleaseToDisk(data: DesktopRelease): Promise<void> {
  try {
    const dir = path.dirname(desktopReleaseDiskPath());
    await mkdir(/* turbopackIgnore: true */ dir, { recursive: true });
    const tmp = `${desktopReleaseDiskPath()}.tmp`;
    const payload = JSON.stringify({
      savedAt: Date.now(),
      tag: data.tag,
      assets: data.assets,
    });
    await writeFile(/* turbopackIgnore: true */ tmp, payload, "utf8");
    await rename(/* turbopackIgnore: true */ tmp, /* turbopackIgnore: true */ desktopReleaseDiskPath());
  } catch {
    /* 只读部署等情况下跳过 */
  }
}

/**
 * 删除本地 `release-cache` 下除 `keepTag` 以外的 release 目录（新版本发布后回收旧安装包/yml 缓存）。
 */
async function pruneReleaseCacheExceptTag(keepTag: string): Promise<void> {
  try {
    assertAllowedReleaseTag(keepTag);
  } catch {
    return;
  }
  const root = getReleaseCacheRoot();
  if (!root) return;

  let entries;
  try {
    entries = await readdir(/* turbopackIgnore: true */ root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const name = ent.name;
    if (name === keepTag) continue;
    if (name.startsWith(".")) continue;
    try {
      assertAllowedReleaseTag(name);
    } catch {
      continue;
    }
    if (!DESKTOP_RELEASE_TAG_PATTERN.test(name)) continue;
    await rm(/* turbopackIgnore: true */ path.join(root, name), { recursive: true, force: true }).catch(() => {});
  }
}

export async function fetchDesktopRelease(): Promise<DesktopRelease | null> {
  const now = Date.now();
  if (desktopReleaseMemory && now - desktopReleaseMemory.fetchedAt < DESKTOP_REFRESH_MS) {
    return desktopReleaseMemory.data;
  }

  const configuredTag = process.env.DESKTOP_RELEASE_TAG?.trim();
  const url = configuredTag
    ? `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${encodeURIComponent(configuredTag)}`
    : `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100`;
  const res = await fetch(url, {
    headers: githubApiHeaders(),
    cache: "no-store",
  });

  if (res.ok) {
    type GithubRelease = {
      tag_name: string;
      draft?: boolean;
      assets: { name: string; browser_download_url: string }[];
    };
    const responseData = (await res.json()) as GithubRelease | GithubRelease[];
    const data = Array.isArray(responseData)
      ? responseData.find(
          (release) =>
            !release.draft &&
            DESKTOP_RELEASE_TAG_PATTERN.test(release.tag_name) &&
            release.assets.some((asset) => XOPC_RELEASE_ASSET_PATTERN.test(asset.name)),
        )
      : responseData;
    if (!data || !DESKTOP_RELEASE_TAG_PATTERN.test(data.tag_name)) {
      return null;
    }
    const result: DesktopRelease = {
      tag: data.tag_name,
      assets: data.assets
        .filter((asset) => isAllowedReleaseAssetName(asset.name))
        .map((asset) => ({
          name: asset.name,
          url: asset.browser_download_url,
        })),
    };
    const prevTag = desktopReleaseMemory?.data?.tag;
    desktopReleaseMemory = { fetchedAt: now, data: result };
    void writeDesktopReleaseToDisk(result);
    if (prevTag !== result.tag) {
      void pruneReleaseCacheExceptTag(result.tag).catch(() => {});
    }
    return result;
  }

  if (desktopReleaseMemory && now - desktopReleaseMemory.fetchedAt < DESKTOP_STALE_MEMORY_MS) {
    return desktopReleaseMemory.data;
  }

  const fromDisk = await readDesktopReleaseFromDisk();
  if (fromDisk && now - fromDisk.savedAt < DESKTOP_STALE_DISK_MS) {
    desktopReleaseMemory = { fetchedAt: fromDisk.savedAt, data: fromDisk.data };
    return fromDisk.data;
  }

  return null;
}

function contentDispositionAttachment(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function webReadableFromNode(stream: import("node:fs").ReadStream): ReadableStream<Uint8Array> {
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
}

async function statSafe(p: string): Promise<import("node:fs").Stats | null> {
  try {
    return await stat(/* turbopackIgnore: true */ p);
  } catch {
    return null;
  }
}

function responseHeadersForReleaseFile(filename: string): {
  contentType: string;
  cacheControl: string;
} {
  if (isElectronUpdateManifestName(filename)) {
    return {
      contentType: "text/yaml; charset=utf-8",
      cacheControl: "public, max-age=120",
    };
  }
  return { contentType: "application/octet-stream", cacheControl: "public, max-age=86400" };
}

async function fileResponseForReleaseAsset(finalPath: string, filename: string): Promise<Response> {
  const s = await stat(/* turbopackIgnore: true */ finalPath);
  const body = webReadableFromNode(createReadStream(/* turbopackIgnore: true */ finalPath));
  const { contentType, cacheControl } = responseHeadersForReleaseFile(filename);
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(s.size),
      "Content-Disposition": contentDispositionAttachment(filename),
      "Cache-Control": cacheControl,
    },
  });
}

function lockPathFor(finalPath: string): string {
  return `${finalPath}.lock`;
}

/**
 * 等待缓存出现，或独占创建 `.lock`。返回 `cached` 表示已有成品；`locked` 表示当前进程持有锁，必须负责释放。
 */
async function waitUntilCachedOrAcquireLock(finalPath: string): Promise<"cached" | "locked"> {
  const lock = lockPathFor(finalPath);
  await mkdir(/* turbopackIgnore: true */ path.dirname(finalPath), { recursive: true });
  const deadline = Date.now() + LOCK_WAIT_MS;

  while (Date.now() < deadline) {
    const st = await statSafe(finalPath);
    if (st) return "cached";

    const lockSt = await statSafe(lock);
    if (lockSt && Date.now() - lockSt.mtimeMs > STALE_LOCK_MS) {
      await unlink(/* turbopackIgnore: true */ lock).catch(() => {});
      continue;
    }

    try {
      await writeFile(/* turbopackIgnore: true */ lock, `${process.pid}\n`, { flag: "wx" });
      const again = await statSafe(finalPath);
      if (again) {
        await unlink(/* turbopackIgnore: true */ lock).catch(() => {});
        return "cached";
      }
      return "locked";
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== "EEXIST") throw e;
    }

    await new Promise((r) => setTimeout(r, LOCK_POLL_MS));
  }

  throw new Error("release_download_lock_timeout");
}

/**
 * 将资源完整拉取并写入缓存（预热用）。与 GET 共用锁，避免并发写同一文件。
 */
export async function warmAssetToDisk(tag: string, name: string, upstreamUrl: string): Promise<void> {
  assertAllowedReleaseTag(tag);
  assertAllowedReleaseAssetName(name);
  const root = getReleaseCacheRoot();
  if (!root) return;

  const finalPath = path.join(root, tag, name);
  if (await statSafe(finalPath)) return;

  const state = await waitUntilCachedOrAcquireLock(finalPath);
  if (state === "cached") return;

  const lock = lockPathFor(finalPath);
  try {
    if (await statSafe(finalPath)) return;
    const res = await fetch(upstreamUrl, {
      headers: upstreamAssetHeaders(),
      redirect: "follow",
      signal: upstreamFetchSignal(name),
    });
    if (!res.ok || !res.body) throw new Error(`upstream ${res.status}`);
    const partPath = `${finalPath}.part`;
    try {
      await pipeline(Readable.fromWeb(res.body as import("stream/web").ReadableStream), createWriteStream(/* turbopackIgnore: true */ partPath));
      await rename(/* turbopackIgnore: true */ partPath, /* turbopackIgnore: true */ finalPath);
    } catch (e) {
      await unlink(/* turbopackIgnore: true */ partPath).catch(() => {});
      throw e;
    }
  } finally {
    await unlink(/* turbopackIgnore: true */ lock).catch(() => {});
  }
}

/**
 * 带本地缓存的下载：`latest-*.yml` 经本站拉取/缓存；其余资源默认 **307 到 GitHub**（避免 nginx 等对大 body 截断）。
 * `upstreamUrl` 须为 GitHub 资源的 `browser_download_url`。
 */
async function serveWithUpstreamUrl(tag: string, name: string, upstreamUrl: string): Promise<Response> {
  const streamThroughApp =
    isElectronUpdateManifestName(name) || shouldProxyBinaryThroughOrigin();

  if (!streamThroughApp) {
    return Response.redirect(upstreamUrl, 307);
  }

  const root = getReleaseCacheRoot();
  const finalPath = root ? path.join(root, tag, name) : null;
  const { contentType: fallbackCt } = responseHeadersForReleaseFile(name);
  const clientCache = isElectronUpdateManifestName(name) ? "no-cache" : "no-store";

  if (!finalPath) {
    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
        headers: upstreamAssetHeaders(),
        redirect: "follow",
        signal: upstreamFetchSignal(name),
      });
    } catch {
      return Response.json({ error: "upstream_timeout" }, { status: 504 });
    }
    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: "upstream" }, { status: 502 });
    }
    const contentType = upstream.headers.get("content-type")?.trim() || fallbackCt;
    const contentLength = upstream.headers.get("content-length");
    return new Response(upstream.body, {
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Content-Disposition": contentDispositionAttachment(name),
        "Cache-Control": clientCache,
      },
    });
  }

  if (await statSafe(finalPath)) {
    return fileResponseForReleaseAsset(finalPath, name);
  }

  const state = await waitUntilCachedOrAcquireLock(finalPath);
  if (state === "cached" || (await statSafe(finalPath))) {
    return fileResponseForReleaseAsset(finalPath, name);
  }

  const lock = lockPathFor(finalPath);
  try {
    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
        headers: upstreamAssetHeaders(),
        redirect: "follow",
        signal: upstreamFetchSignal(name),
      });
    } catch {
      return Response.json({ error: "upstream_timeout" }, { status: 504 });
    }
    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: "upstream" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type")?.trim() || fallbackCt;
    const contentLength = upstream.headers.get("content-length");

    /**
     * 不再对 `upstream.body` 做 `tee()` 边下边写盘：磁盘分支一旦失败（只读部署目录、空间不足等），
     * WHATWG 会取消整个 tee 源，客户端只收到前面一小段却带着完整 `Content-Length`，表现为
     * curl HTTP/2 INTERNAL_ERROR 或 “transfer closed with … bytes remaining”。
     * 未命中缓存时直接透传 GitHub 流；缓存仍由 `warmAssetToDisk` / 预热任务写入。
     */
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": contentDispositionAttachment(name),
      "Cache-Control": clientCache,
    };
    if (contentLength) headers["Content-Length"] = contentLength;

    return new Response(upstream.body, { headers });
  } finally {
    await unlink(/* turbopackIgnore: true */ lock).catch(() => {});
  }
}

/**
 * 带本地缓存的下载：命中则读盘；未命中则透传 GitHub（见 `serveWithUpstreamUrl`）。
 */
export async function serveCachedReleaseDownload(tag: string, name: string): Promise<Response> {
  assertAllowedReleaseTag(tag);
  assertAllowedReleaseAssetName(name);

  const upstreamUrl = await resolveAssetDownloadUrl(tag, name);
  if (!upstreamUrl) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  return serveWithUpstreamUrl(tag, name, upstreamUrl);
}

/**
 * 始终解析当前最新的 **桌面** release 中同名资源（忽略 mobile release）。
 * 供 `GET /api/download/<name>`（updater manifest 与 xopc 桌面安装资产）使用。
 */
export async function serveCachedDesktopReleaseDownload(name: string): Promise<Response> {
  try {
    assertAllowedReleaseAssetName(name);
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const meta = await fetchDesktopRelease();
  if (!meta) {
    return Response.json({ error: "upstream" }, { status: 502 });
  }
  const hit = meta.assets.find((a) => a.name === name);
  if (hit) {
    return serveWithUpstreamUrl(meta.tag, name, hit.url);
  }

  for (const tag of candidateTagsInferredFromXopcAssetName(name)) {
    try {
      assertAllowedReleaseTag(tag);
    } catch {
      continue;
    }
    const upstreamUrl = await resolveAssetDownloadUrl(tag, name);
    if (upstreamUrl) {
      return serveWithUpstreamUrl(tag, name, upstreamUrl);
    }
  }

  return Response.json({ error: "not_found" }, { status: 404 });
}

export function isPrefetchCandidateName(name: string): boolean {
  return isAllowedReleaseAssetName(name);
}
