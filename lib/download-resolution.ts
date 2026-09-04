export type DownloadPlatform = "macos" | "windows" | "linux" | "android" | "ios";

export type DownloadResolution =
  | {
      ok: true;
      platform: "macos" | "windows" | "linux";
      status: "available";
      channel: "desktop-stable";
      version: string;
      assets: { name: string; url: string }[];
    }
  | {
      ok: true;
      platform: "android";
      status: "available";
      channel: "android-stable";
      version: string;
      assets: [{ name: string; url: string }, ...{ name: string; url: string }[]];
    }
  | {
      ok: true;
      platform: "ios";
      status: "testflight";
      channel: "ios-testflight";
      acceptingSignups: boolean;
    }
  | {
      ok: true;
      platform: "ios";
      status: "available";
      channel: "ios-testflight" | "ios-app-store";
      assets: [{ name: string; url: string }];
    }
  | { ok: false; platform: DownloadPlatform; status: "unavailable" };

export const DOWNLOAD_PLATFORMS: DownloadPlatform[] = [
  "macos",
  "windows",
  "linux",
  "android",
  "ios",
];

export function isDownloadPlatform(value: string | null): value is DownloadPlatform {
  return DOWNLOAD_PLATFORMS.includes(value as DownloadPlatform);
}
