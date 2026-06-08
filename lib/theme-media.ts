import { defaultLocale, type Locale } from "@/lib/i18n/config";
import type { Theme } from "@/lib/theme";
import { localeMediaCandidates, type LocaleMediaBase } from "@/lib/locale-media";

function normalizeBasePath(basePath: string): string {
  return basePath.startsWith("/") ? basePath : `/${basePath}`;
}

/**
 * Theme-aware media paths with fallback to locale-only and neutral files.
 * Example: `diagram.dark.zh.png` → `diagram.zh.png` → `diagram.png`
 */
export function themeLocaleMediaCandidates(
  { basePath, ext, localized = true }: LocaleMediaBase,
  locale: Locale,
  theme: Theme,
): string[] {
  const base = normalizeBasePath(basePath);
  const themed: string[] = [];

  if (localized) {
    themed.push(`${base}.${theme}.${locale}.${ext}`);
    if (locale !== defaultLocale) {
      themed.push(`${base}.${theme}.${defaultLocale}.${ext}`);
    }
    themed.push(`${base}.${theme}.${ext}`);
  } else {
    themed.push(`${base}.${theme}.${ext}`);
  }

  return [...new Set([...themed, ...localeMediaCandidates({ basePath, ext, localized }, locale)])];
}
