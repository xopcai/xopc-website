import "server-only";

import type { ProductEventDimensions } from "@/lib/product-events";

const DESKTOP_ASSET_PATTERN = /^xopc-(.+)-(arm64|x64|x86_64|amd64)\.(dmg|zip|exe|AppImage|deb)$/i;

export function downloadEventDimensions(tag: string, name: string): ProductEventDimensions | null {
  if (name === "xopc-android.apk") {
    return { platform: "android", version: tag };
  }

  const match = DESKTOP_ASSET_PATTERN.exec(name);
  if (!match) return null;
  const [, version, rawArchitecture, rawExtension] = match;
  const extension = rawExtension.toLowerCase();
  const platform = extension === "exe"
    ? "windows"
    : extension === "appimage" || extension === "deb"
      ? "linux"
      : "macos";
  return {
    platform,
    architecture: rawArchitecture === "arm64" ? "arm64" : "x64",
    version: tag || version,
  };
}
