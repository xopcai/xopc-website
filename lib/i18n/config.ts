export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function docBaseUrl(locale: Locale): string {
  if (locale === "en") return "https://xopcai.github.io/xopc/";
  return "https://xopcai.github.io/xopc/zh/";
}

export function docUrl(locale: Locale, path: string): string {
  const base = docBaseUrl(locale).replace(/\/$/, "");
  const p = path.replace(/^\//, "");
  return `${base}/${p}`;
}
