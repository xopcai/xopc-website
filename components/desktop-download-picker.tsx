"use client";

import { Download, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { LatestReleasePayload } from "@/lib/github-latest-release";
import { detectArchAsync, detectOsSync, type ClientArch } from "@/lib/client-platform";
import { assetPickers, type ReleaseAsset } from "@/lib/release-assets";
import { RELEASES_INDEX_URL } from "@/lib/downloads";
import type { Messages } from "@/lib/i18n/messages";

type D = Messages["landing"]["download"];
type ChoiceId = keyof D["choices"];
export type DesktopPlatformId = "macos" | "windows" | "linux";

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

export function DesktopDownloadPicker({
  d,
  platform,
}: {
  d: D;
  platform: DesktopPlatformId;
}) {
  const [payload, setPayload] = useState<LatestReleasePayload | null>(null);
  const [arch, setArch] = useState<ClientArch>("unknown");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/github/latest-release");
        const data = (await res.json()) as LatestReleasePayload;
        if (!cancelled) setPayload(data);
      } catch {
        if (!cancelled) setPayload({ ok: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    const assets = payload?.ok === true ? payload.assets : [];
    return CHOICE_ORDER.filter((id) => CHOICE_PLATFORM[id] === platform).map((id) => ({
      id,
      label: d.choices[id],
      asset: PICKERS[id](assets),
    }));
  }, [payload, d.choices, platform]);

  const platformName = d.platformNames[platform];
  const platformSubtitle = d.platformSubtitles[platform];

  if (payload === null) {
    return (
      <div className="desktop-download-picker desktop-download-picker--loading" role="status">
        {d.loading}
      </div>
    );
  }

  if (payload.ok === false) {
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
      <p className="quick-start-comment">
        # {platformName} · {platformSubtitle}
      </p>

      <div className="desktop-download-meta">
        <span className="desktop-download-version">
          {d.currentVersion}: <strong>{payload.tag}</strong>
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

      <ul className="download-os-list">
        {rows.map((row) => (
          <li key={row.id} className="download-os-item">
            <div className="download-os-item-main">
              <span className="download-os-item-label">{row.label}</span>
              {suggested === row.id ? (
                <span className="download-badge-suggested">{d.thisDevice}</span>
              ) : null}
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
