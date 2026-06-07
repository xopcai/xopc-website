import fs from "node:fs";
import path from "node:path";

import type { Locale } from "@/lib/i18n/config";
import { localeMediaCandidates, type LocaleMediaBase } from "@/lib/locale-media";

export function publicFilePath(publicUrl: string): string {
  return path.join(process.cwd(), "public", publicUrl.replace(/^\//, ""));
}

/** Pick the first candidate that exists on disk (server/build time). */
export function resolveLocaleMediaSrc(media: LocaleMediaBase, locale: Locale): string {
  for (const candidate of localeMediaCandidates(media, locale)) {
    if (fs.existsSync(publicFilePath(candidate))) {
      return candidate;
    }
  }
  return localeMediaCandidates(media, locale)[0]!;
}
