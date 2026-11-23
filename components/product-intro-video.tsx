"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { adaFilm } from "@/lib/ada";
import { productIntro } from "@/lib/product-intro";
import { launchFilm } from "@/lib/launch-film";
import { createFilmAnalytics } from "@/lib/film-analytics";
import styles from "./product-intro-video.module.css";

type Variant = "launch" | "ada" | "intro";
type Props = { locale: Locale; preload?: "none" | "metadata"; overview?: boolean; variant?: Variant };

export function ProductIntroVideo(props: Props) {
  const mode: Variant = props.variant ?? (props.overview ? "launch" : "intro");
  return <IntroPlayer key={`${props.locale}:${mode}`} locale={props.locale} preload={props.preload} mode={mode} />;
}

function IntroPlayer({ locale, preload = "none", mode }: { locale: Locale; preload?: "none" | "metadata"; mode: Variant }) {
  const zh = locale === "zh";
  const film = mode === "launch"
    ? (() => {
        const f = launchFilm(locale);
        return {
          ...f,
          playLabel: zh ? "接着向前" : "Keep moving",
          playAria: zh ? "播放产品短片，52 秒" : "Play the 52-second product film",
          analyticsMethod: "launch-overview",
          width: 1920,
          height: 1080,
          showOverlay: true,
        };
      })()
    : mode === "ada"
      ? (() => {
          const f = adaFilm(locale);
          return {
            video: f.video,
            poster: f.poster,
            captions: f.captions,
            language: zh ? "zh-CN" : "en-US",
            captionLabel: zh ? "简体中文" : "English",
            title: zh ? "Ada · 把周末，还给自己。" : "Ada · A little more weekend for you",
            duration: f.duration,
            playLabel: zh ? "把周末，还给自己" : "A little more weekend",
            playAria: zh ? "播放 Ada 介绍短片，64 秒" : "Play the 64-second Ada film",
            analyticsMethod: "ada-overview",
            width: 1920,
            height: 1080,
            showOverlay: true,
          };
        })()
      : (() => {
          const f = productIntro(locale);
          return {
            ...f,
            duration: "",
            playLabel: "",
            playAria: f.title,
            analyticsMethod: "product-intro",
            width: 3840,
            height: 2160,
            showOverlay: false,
          };
        })();

  const player = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);
  const [analytics] = useState(() => createFilmAnalytics(film.analyticsMethod));

  return (
    <div className={styles.player}>
      <div className={styles.screen}>
        <video
          ref={player}
          width={film.width}
          height={film.height}
          controls
          playsInline
          preload={preload}
          poster={film.poster}
          aria-label={film.title}
          onPlay={() => setStarted(true)}
          onPlaying={() => analytics.started()}
          onEnded={(event) => analytics.ended(event.currentTarget)}
          onCanPlay={() => setError(false)}
          onError={() => setError(true)}
        >
          <source src={film.video} type="video/mp4" onError={() => setError(true)} />
          <track kind="captions" src={film.captions} srcLang={film.language} label={film.captionLabel} />
          {film.title}
        </video>
        {film.showOverlay && !started && !error && (
          <button
            className={styles.play}
            type="button"
            aria-label={film.playAria}
            onClick={() => {
              void player.current?.play().catch(() => setStarted(false));
            }}
          >
            <Play size={24} fill="currentColor" aria-hidden="true" />
            <span>
              {film.playLabel}
              <small>{film.duration}</small>
            </span>
          </button>
        )}
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {zh ? "暂时无法播放。" : "Playback unavailable. "}
          <a href={film.video}>{zh ? "打开视频" : "Open video"}</a>
        </p>
      )}
    </div>
  );
}
