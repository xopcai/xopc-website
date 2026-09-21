"use client";

import { useRef, useState } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { productIntro } from "@/lib/product-intro";
import styles from "./product-intro-video.module.css";

const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function ProductIntroVideo(props: { locale: Locale; preload?: "none" | "metadata" }) {
  return <IntroPlayer key={props.locale} {...props} />;
}

function IntroPlayer({ locale, preload = "none" }: { locale: Locale; preload?: "none" | "metadata" }) {
  const film = productIntro(locale);
  const zh = locale === "zh";
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const label = playing ? (zh ? "暂停" : "Pause") : (zh ? "播放" : "Play");
  async function toggle() {
    const el = video.current;
    if (!el) return;
    if (!el.paused) el.pause();
    else try { await el.play(); setError(false); } catch { setError(true); }
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (frame.current?.requestFullscreen) await frame.current.requestFullscreen();
      else (video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null)?.webkitEnterFullscreen?.();
    } catch { video.current?.focus(); }
  }
  return (
    <div ref={frame} className={styles.player}>
      <div className={styles.screen}>
        <video ref={video} width={3840} height={2160} playsInline tabIndex={0}
          preload={preload} poster={film.poster} aria-label={film.title}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") { e.preventDefault(); void toggle(); }
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              if (video.current && duration) video.current.currentTime = Math.max(0, Math.min(duration, position + (e.key === "ArrowRight" ? 5 : -5)));
            }
          }}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onDurationChange={(e) => { if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration); }}
          onVolumeChange={(e) => setMuted(e.currentTarget.muted)} onError={() => setError(true)}>
          <source src={film.video} type="video/mp4" onError={() => setError(true)} />
          <track kind="captions" src={film.captions} srcLang={film.language} label={film.captionLabel} />
          {film.title}
        </video>
      </div>
      <div className={styles.controls} role="group" aria-label={zh ? "视频播放控制" : "Video controls"}>
        <button type="button" onClick={toggle} aria-label={label} title={label}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <span className={styles.time}>{time(position)} / {duration ? time(Math.round(duration)) : film.duration}</span>
        <input className={styles.seek} type="range" min={0} max={duration || 1} step={0.1} value={position}
          disabled={!duration} aria-label={zh ? "播放进度" : "Seek"} aria-valuetext={time(position)}
          onChange={(e) => { if (video.current) video.current.currentTime = Number(e.target.value); setPosition(Number(e.target.value)); }} />
        <button type="button" onClick={() => { if (video.current) video.current.muted = !muted; }}
          aria-label={muted ? (zh ? "开启声音" : "Unmute") : (zh ? "静音" : "Mute")} aria-pressed={muted}>
          {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
        </button>
        <button type="button" onClick={fullscreen} aria-label={zh ? "切换全屏" : "Toggle fullscreen"}><Maximize size={18} /></button>
      </div>
      {error && <p className={styles.error} role="alert">{zh ? "暂时无法播放。" : "Playback unavailable. "}<a href={film.video}>{zh ? "打开视频" : "Open video"}</a></p>}
    </div>
  );
}
