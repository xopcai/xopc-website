"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { productIntro } from "@/lib/product-intro";
import styles from "./product-intro-video.module.css";

export function ProductIntroVideo({ locale, preload = "none" }: { locale: Locale; preload?: "none" | "metadata" }) {
  const film = productIntro(locale);
  const zh = locale === "zh";
  const [error, setError] = useState(false);

  return (
    <div className={styles.player}>
      <div className={styles.screen}>
        <video width={3840} height={2160} controls playsInline
          preload={preload} poster={film.poster} aria-label={film.title}
          onCanPlay={() => setError(false)} onError={() => setError(true)}>
          <source src={film.video} type="video/mp4" onError={() => setError(true)} />
          <track kind="captions" src={film.captions} srcLang={film.language} label={film.captionLabel} />
          {film.title}
        </video>
      </div>
      {error && <p className={styles.error} role="alert">{zh ? "暂时无法播放。" : "Playback unavailable. "}<a href={film.video}>{zh ? "打开视频" : "Open video"}</a></p>}
    </div>
  );
}
