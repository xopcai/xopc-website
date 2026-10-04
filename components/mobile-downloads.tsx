"use client";

import { CheckCircle2, Download, ExternalLink, Mail, QrCode } from "lucide-react";
import Image from "next/image";
import { type FormEvent, useEffect, useId, useState } from "react";
import type { Locale } from "@/lib/i18n/config";

import type { DownloadPlatform, DownloadResolution } from "@/lib/download-resolution";
import type { Messages } from "@/lib/i18n/messages";
import { trackProductEvent } from "@/lib/product-events";

type DownloadMessages = Messages["landing"]["download"];
type SubmitState = "idle" | "submitting" | "success" | "error";

function useDownloadResolution(platform: Extract<DownloadPlatform, "android" | "ios">) {
  const [payload, setPayload] = useState<DownloadResolution | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    const locale = document.documentElement.lang === "en" ? "en" : "zh";
    void fetch(`/api/downloads/resolve?platform=${platform}&locale=${locale}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.json() as Promise<DownloadResolution>)
      .catch((): DownloadResolution => ({ ok: false, platform, status: "unavailable" }))
      .then((result) => {
        window.clearTimeout(timeout);
        if (!cancelled) setPayload(result);
      });
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [platform, attempt]);

  return { payload, retry: () => { setPayload(null); setAttempt(n => n + 1); } };
}

function DownloadStatus({ d, platform, retry, error = false, locale }: { d: DownloadMessages; platform: "android" | "ios"; retry: () => void; error?: boolean; locale: Locale }) {
  return (
    <article className="mobile-app-panel" aria-busy={!error}>
      <div className="mobile-app-panel-copy">
        <span className="mobile-app-eyebrow">{platform === "android" ? d.androidEyebrow : d.iosEyebrow}</span>
        <h3>{platform === "android" ? d.androidTitle : d.iosTitle}</h3>
        <p role="status">{error ? (platform === "android" ? d.downloadUnavailable : d.iosUnavailable) : d.loading}</p>
      </div>
      {error && <div className="download-recovery">
        <button className="mobile-app-primary-action" type="button" onClick={retry}>{d.retry}</button>
        <a href={platform === "android" ? "https://github.com/xopcai/xopc/releases" : `/${locale}/support`}>{platform === "android" ? d.releaseFallback : d.mobileSetup}<ExternalLink size={15} aria-hidden /></a>
      </div>}
    </article>
  );
}

export function AndroidDownload({
  d,
  showQr = true,
  attributionMethod,
  locale = "zh",
}: {
  d: DownloadMessages;
  showQr?: boolean;
  attributionMethod?: string;
  locale?: Locale;
}) {
  const { payload, retry } = useDownloadResolution("android");
  const qrId = useId();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const qrAsset = showQr && payload?.ok && payload.platform === "android" && payload.status === "available"
    ? payload.assets[0]
    : null;

  useEffect(() => {
    if (!qrAsset) return;
    let cancelled = false;
    const downloadUrl = new URL(qrAsset.url, "https://xopc.ai").toString();
    void import("qrcode")
      .then((qrCode) => qrCode.toDataURL(downloadUrl, {
        width: 184,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#0b0d10", light: "#ffffff" },
      }))
      .then((dataUrl) => {
        if (!cancelled) setQrCodeDataUrl(dataUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [qrAsset]);

  if (!payload) return <DownloadStatus d={d} platform="android" retry={retry} locale={locale} />;
  if (!payload.ok || payload.platform !== "android" || payload.status !== "available") {
    return <DownloadStatus d={d} platform="android" retry={retry} locale={locale} error />;
  }
  const downloadAsset = payload.assets[0];
  const checksumAsset = payload.assets.find((asset) => asset.name.endsWith(".sha256"));
  const displayVersion = payload.version.replace(/^mobile-expo-v/, "");

  return (
    <article className="mobile-app-panel">
      <div className="mobile-app-panel-copy">
        <span className="mobile-app-eyebrow">{d.androidEyebrow}</span>
        <h3>{d.androidTitle}</h3>
        <p>{d.androidBody}</p>
        <span className="mobile-app-version">{d.currentVersion}: <strong>{displayVersion}</strong></span>
        <p className="mobile-app-install-note">{d.androidInstallNote}</p>
        {checksumAsset ? (
          <a className="mobile-app-checksum-link" href={checksumAsset.url} download={checksumAsset.name}>
            {d.androidChecksum}
          </a>
        ) : null}
      </div>
      <div className="android-download-action">
        <a
          className="mobile-app-primary-action"
          href={downloadAsset.url}
          download={downloadAsset.name}
          onClick={() => trackProductEvent("android_download_clicked", { method: attributionMethod, platform: "android", version: payload.version })}
        >
          <Download aria-hidden />
          {d.androidDownload}
        </a>
        {showQr ? <details className="download-qr-disclosure">
          <summary aria-controls={qrId}>
            <QrCode aria-hidden />
            {d.androidQrHint}
          </summary>
          <div className="download-qr-content" id={qrId}>
            {qrCodeDataUrl ? (
              <Image src={qrCodeDataUrl} width={184} height={184} unoptimized alt={d.androidQrAlt} />
            ) : (
              <div className="android-download-qr-loading" role="status">{d.androidQrLoading}</div>
            )}
            <strong>{d.androidQrTitle}</strong>
            <p>{d.androidQrDesc}</p>
          </div>
        </details> : null}
      </div>
    </article>
  );
}

function IosSignup({ d, attributionMethod }: { d: DownloadMessages; attributionMethod?: string }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");
    try {
      const response = await fetch("/api/beta-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          company,
          program: "ios-testflight",
          locale: document.documentElement.lang === "en" ? "en" : "zh",
          source: attributionMethod,
        }),
      });
      if (!response.ok) throw new Error("signup_failed");
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <article className="mobile-app-panel mobile-app-panel--success" role="status">
        <CheckCircle2 aria-hidden />
        <div>
          <h3>{d.iosSuccessTitle}</h3>
          <p>{d.iosSuccessBody}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="mobile-app-panel mobile-app-panel--ios">
      <div className="mobile-app-panel-copy">
        <span className="mobile-app-eyebrow">{d.iosEyebrow}</span>
        <h3>{d.iosTitle}</h3>
        <p>{d.iosBody}</p>
      </div>
      <form className="mobile-app-signup" onSubmit={submit}>
        <input
          className="mobile-app-signup-trap"
          type="text"
          name="company"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
        />
        <label htmlFor="ios-testflight-email">{d.iosEmailLabel}</label>
        <div className="mobile-app-signup-row">
          <div className="mobile-app-email-field">
            <Mail aria-hidden />
            <input
              id="ios-testflight-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (submitState === "error") setSubmitState("idle");
              }}
              placeholder={d.iosEmailPlaceholder}
              required
            />
          </div>
          <button type="submit" disabled={submitState === "submitting"}>
            {submitState === "submitting" ? d.iosSubmitting : d.iosSubmit}
          </button>
        </div>
        {submitState === "error" ? <p className="mobile-app-form-error" role="alert">{d.iosError}</p> : null}
        <p className="mobile-app-form-note">{d.iosPrivacy}</p>
      </form>
    </article>
  );
}

export function IosDownload({ d, attributionMethod, locale = "zh" }: { d: DownloadMessages; attributionMethod?: string; locale?: Locale }) {
  const { payload, retry } = useDownloadResolution("ios");

  if (!payload) return <DownloadStatus d={d} platform="ios" retry={retry} locale={locale} />;
  if (!payload.ok || payload.platform !== "ios") return <DownloadStatus d={d} platform="ios" retry={retry} locale={locale} error />;
  if (payload.status === "testflight") {
    return payload.acceptingSignups ? (
      <IosSignup d={d} attributionMethod={attributionMethod} />
    ) : (
      <article className="mobile-app-panel">
        <div className="mobile-app-panel-copy">
          <span className="mobile-app-eyebrow">{d.iosEyebrow}</span>
          <h3>{d.iosPausedTitle}</h3>
          <p>{d.iosPausedBody}</p>
        </div>
      </article>
    );
  }

  const asset = payload.assets[0];
  return (
    <article className="mobile-app-panel">
      <div className="mobile-app-panel-copy">
        <span className="mobile-app-eyebrow">{d.iosEyebrow}</span>
        <h3>{d.iosAvailableTitle}</h3>
        <p>{d.iosAvailableBody}</p>
      </div>
      <a
        className="mobile-app-primary-action"
        href={asset.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackProductEvent("ios_download_clicked", { method: attributionMethod, platform: "ios" })}
      >
        <ExternalLink aria-hidden />
        {payload.channel === "ios-app-store" ? d.iosOpenAppStore : d.iosOpenTestFlight}
      </a>
    </article>
  );
}

export function MobileDownloads({ d, locale = "zh" }: { d: DownloadMessages; locale?: Locale }) {
  return (
    <section className="mobile-download-section" id="mobile-download">
      <div className="container">
        <div className="section-header">
          <h2>{d.mobileSectionTitle}</h2>
          <p>{d.mobileSectionDesc}</p>
          <a className="mobile-setup-link" href={`/${locale}/support`}>{d.mobileSetup} ↗</a>
        </div>
        <div className="mobile-download-grid">
          <AndroidDownload d={d} locale={locale} />
          <IosDownload d={d} locale={locale} />
        </div>
      </div>
    </section>
  );
}
