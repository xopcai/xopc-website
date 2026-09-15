"use client";

import { ArrowLeft, Check, MonitorSmartphone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { SiteHeader } from "@/components/site-header";
import { AndroidDownload, IosDownload } from "@/components/mobile-downloads";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { trackProductEvent } from "@/lib/product-events";

export type MobilePlatform = "android" | "ios";

type Props = {
  locale: Locale;
  messages: Messages;
  initialPlatform: MobilePlatform;
  source?: string;
};

function detectBrowserPlatform(fallback: MobilePlatform): MobilePlatform {
  if (typeof navigator === "undefined") return fallback;
  const ua = navigator.userAgent;
  if (
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
  )
    return "ios";
  if (/Android/i.test(ua)) return "android";
  return fallback;
}

function subscribePlatform(): () => void {
  return () => {};
}

export function MobileDownloadPage({
  locale,
  messages: m,
  initialPlatform,
  source,
}: Props) {
  const detectedPlatform = useSyncExternalStore(
    subscribePlatform,
    () => detectBrowserPlatform(initialPlatform),
    () => initialPlatform,
  );
  const [selectedPlatform, setSelectedPlatform] =
    useState<MobilePlatform | null>(null);
  const platform = selectedPlatform ?? detectedPlatform;
  const page = m.landing.mobilePage;

  useEffect(() => {
    trackProductEvent("mobile_download_page_viewed", {
      method: source,
      platform: detectBrowserPlatform(initialPlatform),
    });
  }, [initialPlatform, source]);

  return (
    <div className="landing-page site-page mobile-download-page">
      <SiteHeader locale={locale} />

      <main className="mobile-page-main">
        <section
          className="mobile-page-intro"
          aria-labelledby="mobile-page-title"
        >
          <div className="mobile-page-app-icon" aria-hidden>
            <MonitorSmartphone />
          </div>
          <p className="mobile-page-eyebrow">{page.eyebrow}</p>
          <h1 id="mobile-page-title">{page.title}</h1>
          <p className="mobile-page-description">{page.description}</p>
          <p className="mobile-page-detected" aria-live="polite">
            <Check aria-hidden />
            {platform === "android" ? page.detectedAndroid : page.detectedIos}
          </p>
        </section>

        <section
          className="mobile-page-download"
          aria-label={page.downloadAria}
        >
          <div
            className="mobile-page-tabs"
            role="tablist"
            aria-label={page.tabsAria}
          >
            {(["android", "ios"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={platform === value}
                onClick={() => setSelectedPlatform(value)}
              >
                {value === "android" ? page.androidTab : page.iosTab}
              </button>
            ))}
          </div>
          <div className="mobile-page-download-panel">
            {platform === "android" ? (
              <AndroidDownload
                d={m.landing.download}
                showQr={false}
                attributionMethod={source}
              />
            ) : (
              <IosDownload d={m.landing.download} attributionMethod={source} />
            )}
          </div>
        </section>

        <section
          className="mobile-page-next"
          aria-labelledby="mobile-page-next-title"
        >
          <div>
            <p className="mobile-page-eyebrow">{page.nextEyebrow}</p>
            <h2 id="mobile-page-next-title">{page.nextTitle}</h2>
          </div>
          <ol>
            {[page.nextOne, page.nextTwo, page.nextThree].map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          <p className="mobile-page-security">
            <ShieldCheck aria-hidden />
            {page.security}
          </p>
        </section>

        <Link href={`/${locale}`} className="mobile-page-back">
          <ArrowLeft aria-hidden />
          {page.backHome}
        </Link>
      </main>
    </div>
  );
}
