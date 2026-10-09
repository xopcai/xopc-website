import release from "@/content/work/manifest.json";
import type { Locale } from "@/lib/i18n/config";

export function workFilm(locale: Locale) {
  const film = release.locales[locale];
  const base = `${release.base}/${film.locale}`;
  const rounded = Math.round(film.durationSeconds);
  return {
    ...film,
    video: `${base}/video.mp4`, poster: `${base}/poster.jpg`, captions: `${base}/captions.vtt`,
    duration: `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`,
  };
}
