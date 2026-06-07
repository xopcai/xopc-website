import { defaultLocale, type Locale } from "@/lib/i18n/config";

/** Public URL path without locale suffix or extension, e.g. `/media/landing/surfaces/tui` */
export type LocaleMediaBase = {
  basePath: string;
  ext: string;
  /** When false, only `{basePath}.{ext}` is used (brand assets, etc.) */
  localized?: boolean;
};

function normalizeBasePath(basePath: string): string {
  return basePath.startsWith("/") ? basePath : `/${basePath}`;
}

/** Ordered fallback: requested locale → default locale → language-neutral. */
export function localeMediaCandidates({ basePath, ext, localized = true }: LocaleMediaBase, locale: Locale): string[] {
  const base = normalizeBasePath(basePath);
  if (!localized) {
    return [`${base}.${ext}`];
  }

  const candidates = [`${base}.${locale}.${ext}`];
  if (locale !== defaultLocale) {
    candidates.push(`${base}.${defaultLocale}.${ext}`);
  }
  candidates.push(`${base}.${ext}`);
  return [...new Set(candidates)];
}

/** Shown in placeholders so designers know the naming convention. */
export function localeMediaFileHint(basePath: string, ext: string, localized = true): string {
  const rel = normalizeBasePath(basePath).replace(/^\//, "");
  return localized ? `${rel}.{locale}.${ext}` : `${rel}.${ext}`;
}
