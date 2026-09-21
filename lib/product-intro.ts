import type { Locale } from "@/lib/i18n/config";

export function productIntro(locale: Locale) {
  const zh = locale === "zh";
  const language = zh ? "zh-CN" : "en-US";
  const base = `/media/product/official-intro/v2/${language}`;
  return {
    video: `${base}/video.mp4`,
    poster: `${base}/poster.jpg`,
    captions: `${base}/captions.vtt`,
    language,
    captionLabel: zh ? "简体中文" : "English",
    title: zh ? "认识 xopc" : "Meet xopc",
    description: zh ? "从一个想法，到真正完成一件事" : "From an idea to work that gets done",
    duration: zh ? "3:35" : "3:39",
  };
}
