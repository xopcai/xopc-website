import "server-only";

import { GITHUB_REPO, githubApiHeaders } from "@/lib/release-download-cache";

export type AndroidRelease = { tag: string; asset: { name: string } };

const MOBILE_TAG_PATTERN = /^mobile-expo-v\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
const ANDROID_ASSET_NAME = "xopc-android.apk";

type GithubRelease = {
  tag_name: string;
  draft: boolean;
  assets: { name: string }[];
};

let mobileReleaseMemory: { fetchedAt: number; release: GithubRelease } | null = null;
const MOBILE_REFRESH_MS = 60_000;
const MOBILE_STALE_MS = 86_400_000;

function isAndroidRelease(release: GithubRelease): boolean {
  return (
    !release.draft &&
    MOBILE_TAG_PATTERN.test(release.tag_name) &&
    release.assets.some((asset) => asset.name === ANDROID_ASSET_NAME)
  );
}

export async function fetchAndroidRelease(): Promise<AndroidRelease | null> {
  const now = Date.now();
  let release =
    mobileReleaseMemory && now - mobileReleaseMemory.fetchedAt < MOBILE_REFRESH_MS
      ? mobileReleaseMemory.release
      : null;

  if (!release) {
    const configuredTag = process.env.MOBILE_RELEASE_TAG?.trim();
    const url = configuredTag
      ? `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${encodeURIComponent(configuredTag)}`
      : `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100`;
    const res = await fetch(url, { headers: githubApiHeaders(), cache: "no-store" });
    if (!res.ok) {
      return mobileReleaseMemory && now - mobileReleaseMemory.fetchedAt < MOBILE_STALE_MS
        ? toAndroidRelease(mobileReleaseMemory.release)
        : null;
    }

    const data = (await res.json()) as GithubRelease | GithubRelease[];
    release = Array.isArray(data) ? data.find(isAndroidRelease) ?? null : data;
    if (!release || !isAndroidRelease(release)) return null;
    mobileReleaseMemory = { fetchedAt: now, release };
  }

  return toAndroidRelease(release);
}

function toAndroidRelease(release: GithubRelease): AndroidRelease | null {
  const asset = release.assets.find((candidate) => candidate.name === ANDROID_ASSET_NAME);
  return asset ? { tag: release.tag_name, asset: { name: asset.name } } : null;
}
