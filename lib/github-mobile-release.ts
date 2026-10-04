import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { GITHUB_REPO, githubApiHeaders } from "@/lib/release-download-cache";

export type AndroidRelease = {
  tag: string;
  asset: { name: string };
  checksumAsset?: { name: string };
};

const MOBILE_TAG_PATTERN = /^mobile-expo-v\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
const ANDROID_ASSET_NAME = "xopc-android.apk";
const ANDROID_CHECKSUM_ASSET_NAME = `${ANDROID_ASSET_NAME}.sha256`;

type GithubRelease = {
  tag_name: string;
  draft: boolean;
  assets: { name: string }[];
};

let mobileReleaseMemory: { fetchedAt: number; release: GithubRelease } | null = null;
const MOBILE_REFRESH_MS = 60_000;
const MOBILE_STALE_MS = 86_400_000;
const MOBILE_DISK_STALE_MS = 7 * MOBILE_STALE_MS;
let retryAfter = 0;
let pending: Promise<AndroidRelease | null> | null = null;

function snapshotPath() {
  return path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "github-mobile-release.json");
}

function validRelease(value: unknown): value is GithubRelease {
  if (!value || typeof value !== "object") return false;
  const r = value as GithubRelease;
  return typeof r.tag_name === "string" && r.draft === false && Array.isArray(r.assets)
    && r.assets.every(a => a && typeof a.name === "string") && isAndroidRelease(r);
}

async function readSnapshot(configuredTag: string | undefined) {
  try {
    const data = JSON.parse(await readFile(/* turbopackIgnore: true */ snapshotPath(), "utf8"));
    const age = Date.now() - data.fetchedAt;
    if (typeof data.fetchedAt !== "number" || age < 0 || age > MOBILE_DISK_STALE_MS
      || !validRelease(data.release) || (configuredTag && data.release.tag_name !== configuredTag)) return null;
    return data as NonNullable<typeof mobileReleaseMemory>;
  } catch { return null; }
}

async function saveSnapshot(snapshot: NonNullable<typeof mobileReleaseMemory>) {
  try {
    const target = snapshotPath();
    await mkdir(/* turbopackIgnore: true */ path.dirname(target), { recursive: true });
    const tmp = `${target}.${process.pid}.tmp`;
    await writeFile(/* turbopackIgnore: true */ tmp, JSON.stringify(snapshot), "utf8");
    await rename(/* turbopackIgnore: true */ tmp, /* turbopackIgnore: true */ target);
  } catch { /* Read-only deployments still use the in-memory snapshot. */ }
}

function isAndroidRelease(release: GithubRelease): boolean {
  return (
    !release.draft &&
    MOBILE_TAG_PATTERN.test(release.tag_name) &&
    release.assets.some((asset) => asset.name === ANDROID_ASSET_NAME)
  );
}

export async function fetchAndroidRelease(): Promise<AndroidRelease | null> {
  if (pending) return pending;
  pending = resolveAndroidRelease().finally(() => { pending = null; });
  return pending;
}

async function resolveAndroidRelease(): Promise<AndroidRelease | null> {
  const now = Date.now();
  const configuredTag = process.env.MOBILE_RELEASE_TAG?.trim();
  if (configuredTag && mobileReleaseMemory?.release.tag_name !== configuredTag) mobileReleaseMemory = null;
  if (!mobileReleaseMemory) mobileReleaseMemory = await readSnapshot(configuredTag);
  if (mobileReleaseMemory && now - mobileReleaseMemory.fetchedAt < MOBILE_REFRESH_MS) {
    return toAndroidRelease(mobileReleaseMemory.release);
  }
  if (now >= retryAfter) {
    retryAfter = now + MOBILE_REFRESH_MS;
    try {
    const url = configuredTag
      ? `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${encodeURIComponent(configuredTag)}`
      : `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100`;
    const res = await fetch(url, { headers: githubApiHeaders(), cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (res.ok) {
      const data: unknown = await res.json();
      const release = Array.isArray(data) ? data.find(validRelease) : data;
      if (validRelease(release) && (!configuredTag || release.tag_name === configuredTag)) {
        mobileReleaseMemory = { fetchedAt: now, release };
        await saveSnapshot(mobileReleaseMemory);
        return toAndroidRelease(release);
      }
    }
    } catch { /* Network failure must also fall back to the last verified release. */ }
  }
  return mobileReleaseMemory && now - mobileReleaseMemory.fetchedAt <= MOBILE_DISK_STALE_MS
    ? toAndroidRelease(mobileReleaseMemory.release) : null;
}

function toAndroidRelease(release: GithubRelease): AndroidRelease | null {
  const asset = release.assets.find((candidate) => candidate.name === ANDROID_ASSET_NAME);
  if (!asset) return null;
  const checksumAsset = release.assets.find(
    (candidate) => candidate.name === ANDROID_CHECKSUM_ASSET_NAME,
  );
  return {
    tag: release.tag_name,
    asset: { name: asset.name },
    ...(checksumAsset ? { checksumAsset: { name: checksumAsset.name } } : {}),
  };
}
