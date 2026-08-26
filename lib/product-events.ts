export const PRODUCT_EVENT_NAMES = [
  "quick_start_method_selected",
  "app_platform_selected",
  "desktop_download_clicked",
  "android_download_clicked",
  "ios_beta_submitted",
  "ios_download_clicked",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export function isProductEventName(value: unknown): value is ProductEventName {
  return typeof value === "string" && PRODUCT_EVENT_NAMES.includes(value as ProductEventName);
}

export function trackProductEvent(
  event: ProductEventName,
  dimensions: {
    method?: string;
    platform?: string;
    architecture?: string;
    version?: string;
    recommended?: boolean;
  } = {},
): void {
  if (typeof window === "undefined") return;
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      ...dimensions,
      locale: document.documentElement.lang === "en" ? "en" : "zh",
    }),
    keepalive: true,
  }).catch(() => {});
}
