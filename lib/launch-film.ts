import release from "@/content/launch/manifest.json";
import type { Locale } from "@/lib/i18n/config";

export function launchFilm(locale: Locale) {
  const zh = locale === "zh";
  return {
    video: `${release.base}/video.mp4`,
    poster: `${release.base}/poster.jpg`,
    captions: `${release.base}/${locale}.vtt`,
    language: zh ? "zh-CN" : "en-US",
    captionLabel: zh ? "简体中文" : "English",
    title: zh ? "XOPC · 接着向前" : "XOPC · Keep what matters moving",
    duration: "0:52",
    width: release.width,
    height: release.height,
    chapters: release.chapters.map(chapter => ({
      start: chapter.start,
      title: chapter[locale],
      thumbnail: `${release.base}/${chapter.thumbnail}`,
    })),
  };
}
