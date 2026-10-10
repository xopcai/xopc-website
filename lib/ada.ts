import release from "@/content/ada/manifest.json";
import type { Locale } from "@/lib/i18n/config";

export function adaFilm(locale: Locale) {
  const film = release.locales[locale];
  const base = `${release.base}/${film.locale}`;
  const seconds = Math.round(film.durationSeconds);
  return {
    video: `${base}/video.mp4`, poster: `${base}/poster.jpg`, captions: `${base}/captions.vtt`,
    duration: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
    chapters: film.chapters,
  };
}
