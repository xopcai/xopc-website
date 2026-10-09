"use client";

import { ArrowUpRight, Play } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { personalAi } from "@/lib/personal-ai";
import styles from "./personal-ai-section.module.css";

export function PersonalAiSection({ locale }: { locale: Locale }) {
  return <PersonalAiFilm key={locale} locale={locale} />;
}

function PersonalAiFilm({ locale }: { locale: Locale }) {
  const c = personalAi(locale);
  const video = useRef<HTMLVideoElement>(null);
  const pendingSeek = useRef<number | null>(null);
  const [error, setError] = useState(false);

  function playFrom(start: number) {
    const player = video.current;
    if (!player) return;
    pendingSeek.current = start;
    if (player.readyState >= 1) {
      player.currentTime = start;
      pendingSeek.current = null;
    }
    player.focus({ preventScroll: true });
    void player.play().catch(() => {});
  }

  return <section className={styles.section} id="personal-ai" aria-labelledby="personal-ai-title">
    <div className={styles.heading}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Personal AI</p>
        <h2 id="personal-ai-title">{c.headline}</h2>
        <p className={styles.description}>{c.description}</p>
      </div>
      <div className={styles.actions}>
        <button className={styles.watch} type="button" onClick={() => playFrom(0)} aria-controls="personal-ai-video">
          <Play size={15} aria-hidden="true" />{c.watch}<span>{c.duration}</span>
        </button>
        <a className={styles.try} href="#download">{c.try}<ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
    </div>
    <figure className={styles.figure}>
      <div className={styles.screen}>
        <video id="personal-ai-video" ref={video} width={c.width} height={c.height} controls playsInline preload="none"
          poster={c.poster} aria-label={c.videoLabel} onError={() => setError(true)} onCanPlay={() => setError(false)}
          onLoadedMetadata={() => {
            if (video.current && pendingSeek.current !== null) {
              video.current.currentTime = pendingSeek.current;
              pendingSeek.current = null;
            }
          }}>
          <source src={c.video} type="video/mp4" />
          <track kind="captions" src={c.captions} srcLang={c.locale} label={c.captionLabel} />
          <a href={c.video}>{c.open}</a>
        </video>
      </div>
      <figcaption>{c.example}</figcaption>
    </figure>
    {error && <p className={styles.error} role="alert">{c.unavailable} <a href={c.video}>{c.open}</a></p>}
    <ol className={styles.steps} aria-label={c.chaptersLabel}>
      {c.steps.map((step, index) => <li key={step.label}>
        <button type="button" onClick={() => playFrom(step.start)} aria-controls="personal-ai-video">
          <span className={styles.number}>0{index + 1}</span><span>{step.label}</span><Play size={13} aria-hidden="true" />
        </button>
      </li>)}
    </ol>
  </section>;
}
