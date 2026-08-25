import "server-only";

import { iosDistribution, releasePublicBaseUrl } from "@/lib/distribution-config.server";
import type { DownloadPlatform, DownloadResolution } from "@/lib/download-resolution";
import { fetchAndroidRelease } from "@/lib/github-mobile-release";
import { assetPickers, type ReleaseAsset } from "@/lib/release-assets";
import { fetchDesktopRelease } from "@/lib/release-download-cache";

function proxyUrl(tag: string, name: string): string {
  const publicBaseUrl = releasePublicBaseUrl();
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;
  }
  return `/api/download/release?tag=${encodeURIComponent(tag)}&name=${encodeURIComponent(name)}`;
}

function assetsForDesktopPlatform(
  platform: "macos" | "windows" | "linux",
  assets: ReleaseAsset[],
): ReleaseAsset[] {
  const pickers = {
    macos: [assetPickers.macArm64, assetPickers.macX64],
    windows: [assetPickers.winX64, assetPickers.winArm64],
    linux: [
      assetPickers.linuxX64AppImage,
      assetPickers.linuxX64Deb,
      assetPickers.linuxArm64AppImage,
    ],
  }[platform];
  return pickers.flatMap((pick) => {
    const asset = pick(assets);
    return asset ? [asset] : [];
  });
}

export async function resolveDownload(platform: DownloadPlatform): Promise<DownloadResolution> {
  if (platform === "ios") {
    const distribution = iosDistribution();
    if (distribution.status === "public" || distribution.status === "released") {
      return {
        ok: true,
        platform,
        status: "available",
        channel: distribution.status === "public" ? "ios-testflight" : "ios-app-store",
        assets: [{
          name: distribution.status === "public" ? "TestFlight" : "App Store",
          url: distribution.url,
        }],
      };
    }
    return {
      ok: true,
      platform,
      status: "testflight",
      channel: "ios-testflight",
      acceptingSignups: distribution.status === "accepting",
    };
  }

  if (platform === "android") {
    const release = await fetchAndroidRelease();
    if (!release) return { ok: false, platform, status: "unavailable" };
    return {
      ok: true,
      platform,
      status: "available",
      channel: "android-stable",
      version: release.tag,
      assets: [{ name: release.asset.name, url: proxyUrl(release.tag, release.asset.name) }],
    };
  }

  const release = await fetchDesktopRelease();
  if (!release) return { ok: false, platform, status: "unavailable" };
  return {
    ok: true,
    platform,
    status: "available",
    channel: "desktop-stable",
    version: release.tag,
    assets: assetsForDesktopPlatform(platform, release.assets).map((asset) => ({
      name: asset.name,
      url: proxyUrl(release.tag, asset.name),
    })),
  };
}
