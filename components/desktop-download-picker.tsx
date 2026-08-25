"use client";

import { Download, ExternalLink } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { detectArchAsync, detectOsSync, type ClientArch } from "@/lib/client-platform";
import type { DownloadResolution } from "@/lib/download-resolution";
import { assetPickers, type ReleaseAsset } from "@/lib/release-assets";
import { RELEASES_INDEX_URL } from "@/lib/downloads";
import type { Messages } from "@/lib/i18n/messages";

type D = Messages["landing"]["download"];
type ChoiceId = keyof D["choices"];
export type DesktopPlatformId = "macos" | "windows" | "linux";
type DesktopResolution = Extract<DownloadResolution, { channel: "desktop-stable" }>;

const CHOICE_ORDER: ChoiceId[] = [
  "mac-arm64",
  "mac-x64",
  "win-x64",
  "win-arm64",
  "linux-x64-appimage",
  "linux-x64-deb",
  "linux-arm64-appimage",
];

const PICKERS: Record<ChoiceId, (assets: ReleaseAsset[]) => ReleaseAsset | undefined> = {
  "mac-arm64": assetPickers.macArm64,
  "mac-x64": assetPickers.macX64,
  "win-x64": assetPickers.winX64,
  "win-arm64": assetPickers.winArm64,
  "linux-x64-appimage": assetPickers.linuxX64AppImage,
  "linux-x64-deb": assetPickers.linuxX64Deb,
  "linux-arm64-appimage": assetPickers.linuxArm64AppImage,
};

const CHOICE_PLATFORM: Record<ChoiceId, DesktopPlatformId> = {
  "mac-arm64": "macos",
  "mac-x64": "macos",
  "win-x64": "windows",
  "win-arm64": "windows",
  "linux-x64-appimage": "linux",
  "linux-x64-deb": "linux",
  "linux-arm64-appimage": "linux",
};

function ariaFmt(template: string, label: string) {
  return template.replace(/\{label\}/g, label);
}

function isDesktopResolution(payload: DownloadResolution): payload is DesktopResolution {
  return payload.ok && payload.channel === "desktop-stable";
}

export function DesktopDownloadPicker({
  d,
  platform,
  platformSelector,
}: {
  d: D;
  platform: DesktopPlatformId;
  platformSelector?: ReactNode;
}) {
  const [payload, setPayload] = useState<DownloadResolution | null>(null);
  const [arch, setArch] = useState<ClientArch>("unknown");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/downloads/resolve?platform=${platform}`);
        const data = (await res.json()) as DownloadResolution;
        if (!cancelled) setPayload(data);
      } catch {
        if (!cancelled) setPayload({ ok: false, platform, status: "unavailable" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [platform]);

  useEffect(() => {
    void detectArchAsync().then(setArch);
  }, []);

  const suggested = useMemo((): ChoiceId | null => {
    const os = detectOsSync();
    if (os === "macos") {
      if (arch === "arm64") return "mac-arm64";
      if (arch === "x64") return "mac-x64";
      return "mac-arm64";
    }
    if (os === "windows") {
      if (arch === "arm64") return "win-arm64";
      if (arch === "x64") return "win-x64";
      return "win-x64";
    }
    if (os === "linux") {
      if (arch === "arm64") return "linux-arm64-appimage";
      if (arch === "x64") return "linux-x64-appimage";
      return "linux-x64-appimage";
    }
    return null;
  }, [arch]);

  const rows = useMemo(() => {
    const assets = payload && isDesktopResolution(payload) ? payload.assets : [];
    return CHOICE_ORDER.filter((id) => CHOICE_PLATFORM[id] === platform).map((id) => ({
      id,
      label: d.choices[id],
      asset: PICKERS[id](assets),
    }));
  }, [payload, d.choices, platform]);

  const platformName = d.platformNames[platform];
  const platformSubtitle = d.platformSubtitles[platform];

  const recommended = useMemo(() => {
    if (!suggested || !payload || !isDesktopResolution(payload)) return null;
    const asset = PICKERS[suggested](payload.assets);
    if (!asset) return null;
    const recommendedPlatform = CHOICE_PLATFORM[suggested];
    return {
      id: suggested,
      asset,
      label: d.choices[suggested],
      platformName: d.platformNames[recommendedPlatform],
      platformSubtitle: d.platformSubtitles[recommendedPlatform],
    };
  }, [d.choices, d.platformNames, d.platformSubtitles, payload, suggested]);

  if (payload === null) {
    return (
      <div className="desktop-download-picker desktop-download-picker--loading" role="status">
        {d.loading}
      </div>
    );
  }

  if (!isDesktopResolution(payload)) {
    return (
      <div className="desktop-download-picker desktop-download-picker--error">
        <p>{d.error}</p>
        <a
          className="btn-secondary desktop-download-fallback"
          href={RELEASES_INDEX_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="btn-ic" strokeWidth={1.75} aria-hidden />
          {d.openReleases}
        </a>
      </div>
    );
  }

  return (
    <div className="desktop-download-picker desktop-download-picker--single">
      <div className="desktop-download-meta">
        <span className="desktop-download-version">
          {d.currentVersion}: <strong>{payload.version}</strong>
        </span>
        <a
          href={RELEASES_INDEX_URL}
          className="desktop-download-releases-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {d.openReleases}
          <ExternalLink className="desktop-download-releases-ic" strokeWidth={1.75} aria-hidden />
        </a>
      </div>

      {recommended ? (
        <div className="desktop-download-recommended">
          <div>
            <span className="desktop-download-recommended-label">{d.recommendedForThisDevice}</span>
            <h3>{recommended.platformName} · {recommended.label}</h3>
            <p>{recommended.platformSubtitle} · {payload.version}</p>
          </div>
          <a
            className="desktop-download-recommended-cta"
            href={recommended.asset.url}
            download={recommended.asset.name}
            aria-label={ariaFmt(d.downloadAria, recommended.label)}
          >
            {d.downloadRecommended.replace("{label}", recommended.label)}
            <Download strokeWidth={2} aria-hidden />
          </a>
        </div>
      ) : null}

      <div className="desktop-download-list-header">
        <p className="desktop-download-list-title">
          {recommended ? d.otherDownloads : `${platformName} · ${platformSubtitle}`}
        </p>
        {platformSelector}
      </div>

      <ul className="download-os-list" id="desktop-download-options">
        {rows.filter((row) => row.id !== recommended?.id).map((row) => (
          <li key={row.id} className="download-os-item">
            <div className="download-os-item-main">
              <span className="download-os-item-label">{row.label}</span>
            </div>
            <div className="download-os-item-actions">
              {row.asset ? (
                <a
                  className="download-os-item-dl"
                  href={row.asset.url}
                  download={row.asset.name}
                  aria-label={ariaFmt(d.downloadAria, row.label)}
                >
                  <Download strokeWidth={2} className="download-os-item-dl-ic" aria-hidden />
                </a>
              ) : (
                <span className="download-unavailable">—</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
