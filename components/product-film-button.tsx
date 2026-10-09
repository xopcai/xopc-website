"use client";

import { Play, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import styles from "./product-film-button.module.css";

type Film = { video: string; poster: string; captions: string; duration: string };
type Props = { locale: Locale; film: Film; title: string; label: string; start?: number; children?: ReactNode; className?: string };

export function ProductFilmButton(props: Props) {
  return <FilmButton key={`${props.locale}:${props.film.video}`} {...props} />;
}

function FilmButton({ locale, film, title, label, start = 0, children, className }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const id = useId();
  const zh = locale === "zh";

  useEffect(() => {
    if (!open) return;
    const player = dialog.current;
    const opener = trigger.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    player?.showModal();
    return () => {
      player?.close();
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, [open]);

  function close() {
    video.current?.pause();
    setOpen(false);
  }

  return <>
    <button ref={trigger} className={className ?? styles.watch} type="button" aria-label={label} aria-haspopup="dialog" aria-controls={id} onClick={() => { setFailed(false); setOpen(true); }}>
      {children ?? <><Play size={15} aria-hidden="true" />{label}<span className={styles.duration}>{film.duration}</span></>}
    </button>
    <dialog id={id} className={styles.dialog} ref={dialog} aria-labelledby={`${id}-title`} onClose={close} onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    }}>
      {open && <>
        <header className={styles.header}><h2 id={`${id}-title`}>{title}</h2><button type="button" autoFocus onClick={close} aria-label={zh ? "关闭视频" : "Close video"}><X size={20} aria-hidden="true" /></button></header>
        <div className={styles.body}>
          <video ref={video} controls autoPlay playsInline preload="metadata" poster={film.poster} aria-label={title}
            onError={() => setFailed(true)} onLoadedMetadata={() => { if (video.current) video.current.currentTime = start; }}>
            <source src={film.video} type="video/mp4" />
            <track kind="captions" src={film.captions} srcLang={zh ? "zh-CN" : "en-US"} label={zh ? "简体中文" : "English"} />
          </video>
          {failed && <p role="alert">{zh ? "暂时无法播放。" : "Playback unavailable."} <a href={film.video}>{zh ? "打开视频" : "Open video"}</a></p>}
        </div>
      </>}
    </dialog>
  </>;
}
