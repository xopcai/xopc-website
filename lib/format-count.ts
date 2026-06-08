import type { Locale } from "@/lib/i18n/config";

/** Compact number for badges (stars, downloads). */
export function formatCompactCount(value: number, locale: Locale): string {
  const n = Math.max(0, Math.floor(value));
  if (locale === "zh") {
    if (n >= 10_000) {
      const wan = n / 10_000;
      return `${wan >= 10 ? Math.round(wan) : wan.toFixed(1).replace(/\.0$/, "")} 万`;
    }
    if (n >= 1000) {
      const k = n / 1000;
      return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
    }
    return String(n);
  }

  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}
