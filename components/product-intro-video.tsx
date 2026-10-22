"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { productIntro } from "@/lib/product-intro";
import { launchFilm } from "@/lib/launch-film";
import { createFilmAnalytics } from "@/lib/film-analytics";
import styles from "./product-intro-video.module.css";

type Props = { locale: Locale; preload?: "none" | "metadata"; overview?: boolean };

export function ProductIntroVideo(props: Props) {
  return <IntroPlayer key={`${props.locale}:${props.overview ?? false}`} {...props} />;
}

function IntroPlayer({ locale, preload = "none", overview = false }: Props) {
  const zh = locale === "zh";
  const film = overview ? launchFilm(locale) : productIntro(locale);
  const player = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);
  const [analytics] = useState(() => createFilmAnalytics(overview ? "launch-overview" : "product-intro"));

  return (
    <div className={styles.player}>
      <div className={styles.screen}>
        <video ref={player} width={overview ? 1920 : 3840} height={overview ? 1080 : 2160} controls playsInline
          preload={preload} poster={film.poster} aria-label={film.title}
          onPlay={() => setStarted(true)} onPlaying={() => analytics.started()} onEnded={event => analytics.ended(event.currentTarget)}
          onCanPlay={() => setError(false)} onError={() => setError(true)}>
          <source src={film.video} type="video/mp4" onError={() => setError(true)} />
          <track kind="captions" src={film.captions} srcLang={film.language} label={film.captionLabel} />
          {film.title}
        </video>
        {overview && !started && !error && <button className={styles.play} type="button" aria-label={zh ? "播放产品短片，52 秒" : "Play the 52-second product film"} onClick={() => { void player.current?.play().catch(() => setStarted(false)); }}><Play size={24} fill="currentColor" aria-hidden="true" /><span>{zh ? "接着向前" : "Keep moving"}<small>0:52</small></span></button>}
      </div>
      {error && <p className={styles.error} role="alert">{zh ? "暂时无法播放。" : "Playback unavailable. "}<a href={film.video}>{zh ? "打开视频" : "Open video"}</a></p>}
    </div>
  );
}
