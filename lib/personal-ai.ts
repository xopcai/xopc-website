import release from "@/content/personal-ai/manifest.json";
import type { Locale } from "@/lib/i18n/config";

const copy = {
  zh: {
    headline: "属于你的个人 Agent。",
    description: "告诉它你的背景和目标，从讨论到文件，沿着同一件事继续。",
    watch: "观看介绍", try: "开始使用 xopc", example: "桌面演示 · 一周的工作与摄影计划",
    videoLabel: "xopc Personal AI：了解近况、交办周计划、检查与修改",
    chaptersLabel: "选择视频章节", captionLabel: "简体中文",
    steps: ["带入你的背景", "交办一件事", "检查，再打磨"],
    unavailable: "暂时无法播放。", open: "打开视频",
  },
  en: {
    headline: "Your way of working.\nMore work, done.",
    description: "Share your context and your goal. Keep the conversation going, from the first idea to a finished file.",
    watch: "Watch the film", try: "Get started with xopc", example: "Desktop walkthrough · A weekly plan for work and photography",
    videoLabel: "xopc Personal AI: share context, delegate a weekly plan, review and refine",
    chaptersLabel: "Choose a video chapter", captionLabel: "English",
    steps: ["Share your context", "Delegate a task", "Review and refine"],
    unavailable: "Playback unavailable.", open: "Open video",
  },
};

export function personalAi(locale: Locale) {
  const film = release.locales[locale];
  const base = `${release.base}/${film.locale}`;
  const rounded = Math.round(film.durationSeconds);
  return {
    ...copy[locale], ...film,
    video: `${base}/video.mp4`, poster: `${base}/poster.jpg`, captions: `${base}/captions.vtt`,
    duration: `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`,
    steps: copy[locale].steps.map((label, index) => ({ label, start: film.chapters[[1, 3, 4][index]].start })),
  };
}
