"use client";

import { CheckCircle2, Download, ExternalLink, Mail, QrCode } from "lucide-react";
import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";

import type { DownloadPlatform, DownloadResolution } from "@/lib/download-resolution";
import type { Messages } from "@/lib/i18n/messages";
import { trackProductEvent } from "@/lib/product-events";

type DownloadMessages = Messages["landing"]["download"];
type SubmitState = "idle" | "submitting" | "success" | "error";

function useDownloadResolution(platform: Extract<DownloadPlatform, "android" | "ios">) {
  const [payload, setPayload] = useState<DownloadResolution | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/downloads/resolve?platform=${platform}`)
      .then((response) => response.json() as Promise<DownloadResolution>)
      .catch((): DownloadResolution => ({ ok: false, platform, status: "unavailable" }))
      .then((result) => {
        if (!cancelled) setPayload(result);
      });
    return () => {
      cancelled = true;
    };
  }, [platform]);

  return payload;
}

function DownloadStatus({ children, error = false }: { children: string; error?: boolean }) {
  return (
    <div className={`mobile-download-status${error ? " mobile-download-status--error" : ""}`} role="status">
      {children}
    </div>
  );
}

function AndroidDownload({ d }: { d: DownloadMessages }) {
  const payload = useDownloadResolution("android");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const qrAsset = payload?.ok && payload.platform === "android" && payload.status === "available"
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

  if (!payload) return <DownloadStatus>{d.loading}</DownloadStatus>;
  if (!payload.ok || payload.platform !== "android" || payload.status !== "available") {
    return <DownloadStatus error>{d.error}</DownloadStatus>;
  }
  const downloadAsset = payload.assets[0];

  return (
    <article className="mobile-app-panel">
      <div className="mobile-app-panel-copy">
        <span className="mobile-app-eyebrow">{d.androidEyebrow}</span>
        <h3>{d.androidTitle}</h3>
        <p>{d.androidBody}</p>
        <span className="mobile-app-version">{d.currentVersion}: <strong>{payload.version}</strong></span>
      </div>
      <div className="android-download-action">
        <a
          className="mobile-app-primary-action"
          href={downloadAsset.url}
          download={downloadAsset.name}
          aria-describedby="android-download-qr-hint"
          onClick={() => trackProductEvent("android_download_clicked", { platform: "android", version: payload.version })}
        >
          <Download aria-hidden />
          {d.androidDownload}
        </a>
        <span className="android-download-qr-hint" id="android-download-qr-hint">
          <QrCode aria-hidden />
          {d.androidQrHint}
        </span>
        <div className="android-download-qr" role="tooltip">
          {qrCodeDataUrl ? (
            <Image src={qrCodeDataUrl} width={184} height={184} unoptimized alt={d.androidQrAlt} />
          ) : (
            <div className="android-download-qr-loading" role="status">{d.androidQrLoading}</div>
          )}
          <strong>{d.androidQrTitle}</strong>
          <p>{d.androidQrDesc}</p>
        </div>
      </div>
    </article>
  );
}

function IosSignup({ d }: { d: DownloadMessages }) {
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
        }),
      });
      if (!response.ok) throw new Error("signup_failed");
      setSubmitState("success");
      trackProductEvent("ios_beta_submitted", { platform: "ios" });
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

function IosDownload({ d }: { d: DownloadMessages }) {
  const payload = useDownloadResolution("ios");

  if (!payload) return <DownloadStatus>{d.loading}</DownloadStatus>;
  if (!payload.ok || payload.platform !== "ios") return <DownloadStatus error>{d.error}</DownloadStatus>;
  if (payload.status === "testflight") {
    return payload.acceptingSignups ? (
      <IosSignup d={d} />
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
        onClick={() => trackProductEvent("ios_download_clicked", { platform: "ios" })}
      >
        <ExternalLink aria-hidden />
        {payload.channel === "ios-app-store" ? d.iosOpenAppStore : d.iosOpenTestFlight}
      </a>
    </article>
  );
}

export function MobileDownloads({ d }: { d: DownloadMessages }) {
  return (
    <section className="mobile-download-section landing-reveal" id="mobile-download">
      <div className="container">
        <div className="section-header">
          <p className="section-kicker">{d.mobileSectionKicker}</p>
          <h2>{d.mobileSectionTitle}</h2>
          <p>{d.mobileSectionDesc}</p>
        </div>
        <div className="mobile-download-grid">
          <AndroidDownload d={d} />
          <IosDownload d={d} />
        </div>
      </div>
    </section>
  );
}
