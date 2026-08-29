"use client";

import { useState, useSyncExternalStore } from "react";

import { DesktopDownloadPicker } from "@/components/desktop-download-picker";
import { detectOsSync } from "@/lib/client-platform";
import type { Messages } from "@/lib/i18n/messages";
import { trackProductEvent } from "@/lib/product-events";

type DesktopPlatformId = "macos" | "windows" | "linux";
type DownloadMessages = Messages["landing"]["download"];

type Props = {
  id?: string;
  d: DownloadMessages;
  kicker: string;
  title: string;
  desc: string;
};

const platforms: DesktopPlatformId[] = ["macos", "windows", "linux"];

function subscribeToBrowserPlatform() {
  return () => {};
}

function getBrowserPlatform(): DesktopPlatformId {
  const detected = detectOsSync();
  return detected === "unknown" ? "macos" : detected;
}

function getServerPlatform(): DesktopPlatformId {
  return "macos";
}

export function ProductDesktopDownloads({ id = "get-started", d, kicker, title, desc }: Props) {
  const detectedPlatform = useSyncExternalStore(
    subscribeToBrowserPlatform,
    getBrowserPlatform,
    getServerPlatform,
  );
  const [selectedPlatform, setSelectedPlatform] = useState<DesktopPlatformId | null>(null);
  const platform = selectedPlatform ?? detectedPlatform;

  return (
    <section className="product-get-started product-get-started--desktop" id={id}>
      <div className="container">
        <div className="product-section-header product-section-header--centered">
          <p className="product-kicker">{kicker}</p>
          <h2>{title}</h2>
          <p>{desc}</p>
        </div>
        <div className="product-desktop-downloads">
          <DesktopDownloadPicker
            d={d}
            platform={platform}
            platformSelector={
              <div className="product-desktop-platforms" role="tablist" aria-label={d.appsPlatformTabsAria}>
                {platforms.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={platform === id}
                    aria-controls="desktop-download-options"
                    className={platform === id ? "is-active" : undefined}
                    onClick={() => {
                      setSelectedPlatform(id);
                      trackProductEvent("desktop_platform_selected", { platform: id });
                    }}
                  >
                    {d.platformNames[id]}
                  </button>
                ))}
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}
