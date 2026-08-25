"use client";

import { CheckCircle2, Download, ExternalLink, Mail, QrCode } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import type { DownloadResolution } from "@/lib/download-resolution";
import type { Messages } from "@/lib/i18n/messages";
import { trackProductEvent } from "@/lib/product-events";

type D = Messages["landing"]["download"];

function MobilePairingGuide({ d }: { d: D }) {
  return (
    <div className="mobile-pairing-guide">
      <div className="mobile-pairing-guide-icon"><QrCode aria-hidden /></div>
      <div>
        <h4>{d.mobilePairingTitle}</h4>
        <ol>
          <li><strong>{d.mobilePairingStep1Title}</strong> {d.mobilePairingStep1Body}</li>
          <li><strong>{d.mobilePairingStep2Title}</strong> {d.mobilePairingStep2Body}</li>
        </ol>
      </div>
    </div>
  );
}

export function AndroidDownload({ d }: { d: D }) {
  const [payload, setPayload] = useState<DownloadResolution | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/downloads/resolve?platform=android")
      .then((response) => response.json() as Promise<DownloadResolution>)
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch(() => {
        if (!cancelled) setPayload({ ok: false, platform: "android", status: "unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (payload === null) {
    return <div className="mobile-download-status" role="status">{d.loading}</div>;
  }

  if (!payload.ok || payload.platform !== "android" || payload.status !== "available") {
    return <div className="mobile-download-status mobile-download-status--error">{d.error}</div>;
  }

  return (
    <div className="mobile-app-stack">
      <div className="mobile-app-panel">
        <div className="mobile-app-panel-copy">
          <span className="mobile-app-eyebrow">{d.androidEyebrow}</span>
          <h3>{d.androidTitle}</h3>
          <p>{d.androidBody}</p>
          <span className="mobile-app-version">{d.currentVersion}: <strong>{payload.version}</strong></span>
        </div>
        <a
          className="mobile-app-primary-action"
          href={payload.assets[0].url}
          download={payload.assets[0].name}
          onClick={() => trackProductEvent("android_download_clicked", { platform: "android" })}
        >
          <Download aria-hidden />
          {d.androidDownload}
        </a>
      </div>
      <MobilePairingGuide d={d} />
    </div>
  );
}

type SubmitState = "idle" | "submitting" | "success" | "error";

function IosTestFlightSignup({ d }: { d: D }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    try {
      const response = await fetch("/api/beta-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          program: "ios-testflight",
          locale: document.documentElement.lang === "en" ? "en" : "zh",
          company,
        }),
      });
      if (!response.ok) throw new Error("signup_failed");
      setState("success");
      trackProductEvent("ios_beta_submitted", { platform: "ios" });
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="mobile-app-panel mobile-app-panel--success" role="status">
        <CheckCircle2 aria-hidden />
        <div>
          <h3>{d.iosSuccessTitle}</h3>
          <p>{d.iosSuccessBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app-panel mobile-app-panel--ios">
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
                if (state === "error") setState("idle");
              }}
              placeholder={d.iosEmailPlaceholder}
              required
            />
          </div>
          <button type="submit" disabled={state === "submitting"}>
            {state === "submitting" ? d.iosSubmitting : d.iosSubmit}
          </button>
        </div>
        {state === "error" ? <p className="mobile-app-form-error" role="alert">{d.iosError}</p> : null}
        <p className="mobile-app-form-note">{d.iosPrivacy}</p>
      </form>
    </div>
  );
}

export function IosDistribution({ d }: { d: D }) {
  const [payload, setPayload] = useState<DownloadResolution | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/downloads/resolve?platform=ios")
      .then((response) => response.json() as Promise<DownloadResolution>)
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch(() => {
        if (!cancelled) setPayload({ ok: false, platform: "ios", status: "unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (payload === null) {
    return <div className="mobile-download-status" role="status">{d.loading}</div>;
  }
  if (!payload.ok || payload.platform !== "ios") {
    return <div className="mobile-download-status mobile-download-status--error">{d.error}</div>;
  }

  if (payload.status === "available") {
    const asset = payload.assets[0];
    return (
      <div className="mobile-app-stack">
        <div className="mobile-app-panel">
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
        </div>
        <MobilePairingGuide d={d} />
      </div>
    );
  }

  return (
    <div className="mobile-app-stack">
      {payload.acceptingSignups ? (
        <IosTestFlightSignup d={d} />
      ) : (
        <div className="mobile-app-panel">
          <div className="mobile-app-panel-copy">
            <span className="mobile-app-eyebrow">{d.iosEyebrow}</span>
            <h3>{d.iosPausedTitle}</h3>
            <p>{d.iosPausedBody}</p>
          </div>
        </div>
      )}
      <MobilePairingGuide d={d} />
    </div>
  );
}
