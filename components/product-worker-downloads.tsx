"use client";

import { useState } from "react";

import { DesktopDownloadPicker } from "@/components/desktop-download-picker";
import type { Messages } from "@/lib/i18n/messages";

type DesktopPlatformId = "macos" | "windows" | "linux";
type DownloadMessages = Messages["landing"]["download"];

type Props = {
  d: DownloadMessages;
  kicker: string;
  title: string;
  desc: string;
};

const platforms: DesktopPlatformId[] = ["macos", "windows", "linux"];

export function ProductWorkerDownloads({ d, kicker, title, desc }: Props) {
  const [platform, setPlatform] = useState<DesktopPlatformId>("macos");

  return (
    <section className="product-get-started" id="get-started">
      <div className="container">
        <div className="product-section-header">
          <p className="product-kicker">{kicker}</p>
          <h2>{title}</h2>
          <p>{desc}</p>
        </div>
        <div className="product-worker-downloads">
          <div className="product-worker-platforms" role="tablist" aria-label={d.appsPlatformTabsAria}>
            {platforms.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={platform === id}
                className={platform === id ? "is-active" : undefined}
                onClick={() => setPlatform(id)}
              >
                {d.platformNames[id]}
              </button>
            ))}
          </div>
          <DesktopDownloadPicker d={d} platform={platform} />
        </div>
      </div>
    </section>
  );
}
