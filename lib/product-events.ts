export const PRODUCT_EVENT_NAMES = [
  "page_viewed",
  "download_section_viewed",
  "nav_download_clicked",
  "hero_download_clicked",
  "terminal_install_clicked",
  "product_path_selected",
  "final_download_clicked",
  "desktop_platform_selected",
  "desktop_download_clicked",
  "android_download_clicked",
  "ios_beta_signup_succeeded",
  "ios_download_clicked",
  "download_started",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];
export type DeviceType = "desktop" | "mobile" | "tablet";

export type ProductEventDimensions = {
  method?: string;
  platform?: string;
  architecture?: string;
  version?: string;
  recommended?: boolean;
};

export type ProductEventEnvelope = ProductEventDimensions & {
  event: ProductEventName;
  eventId: string;
  sessionId: string;
  locale: "zh" | "en";
  path: string;
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType: DeviceType;
  occurredAt: string;
};

const SESSION_ID_KEY = "xopc-analytics-session";
const ATTRIBUTION_KEY = "xopc-analytics-attribution";

export function isProductEventName(value: unknown): value is ProductEventName {
  return typeof value === "string" && PRODUCT_EVENT_NAMES.includes(value as ProductEventName);
}

function randomId(): string {
  return crypto.randomUUID();
}

function sessionId(): string {
  try {
    const current = sessionStorage.getItem(SESSION_ID_KEY);
    if (current) return current;
    const created = randomId();
    sessionStorage.setItem(SESSION_ID_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}

function referrerDomain(): string | undefined {
  if (!document.referrer) return undefined;
  try {
    const hostname = new URL(document.referrer).hostname.toLowerCase();
    return hostname && hostname !== window.location.hostname.toLowerCase() ? hostname : undefined;
  } catch {
    return undefined;
  }
}

function deviceType(): DeviceType {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    return "tablet";
  }
  return /Android|iPhone|iPod|Mobile/i.test(ua) ? "mobile" : "desktop";
}

type Attribution = Pick<ProductEventEnvelope, "referrerDomain" | "utmSource" | "utmMedium" | "utmCampaign">;

function attribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const current: Attribution = {
    referrerDomain: referrerDomain(),
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  };
  try {
    const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (stored) return JSON.parse(stored) as Attribution;
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
  } catch {
    // Analytics must never affect the page when storage is unavailable.
  }
  return current;
}

function eventEnvelope(event: ProductEventName, dimensions: ProductEventDimensions): ProductEventEnvelope {
  return {
    event,
    eventId: randomId(),
    sessionId: sessionId(),
    locale: document.documentElement.lang === "en" ? "en" : "zh",
    path: window.location.pathname,
    ...attribution(),
    deviceType: deviceType(),
    occurredAt: new Date().toISOString(),
    ...dimensions,
  };
}

export function trackProductEvent(
  event: ProductEventName,
  dimensions: ProductEventDimensions = {},
): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(eventEnvelope(event, dimensions));
    if (navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics is best-effort and must never interfere with product actions.
  }
}
