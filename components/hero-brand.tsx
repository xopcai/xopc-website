"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { XopcLogoMark } from "@/components/xopc-logo-mark";

const TYPE_MS = 68;
/** After wheel roll + wordmark stagger */
const TYPE_START_MS = 1080;

function HeroTypewriter({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let intervalId: number | undefined;
    let resetDelay: number | undefined;
    let i = 0;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      resetDelay = window.setTimeout(() => {
        setShown(text);
        setDone(true);
      }, 0);
      return () => {
        if (resetDelay !== undefined) window.clearTimeout(resetDelay);
      };
    }

    resetDelay = window.setTimeout(() => {
      setShown("");
      setDone(false);
    }, 0);

    const startDelay = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          if (intervalId !== undefined) window.clearInterval(intervalId);
          setDone(true);
        }
      }, TYPE_MS);
    }, TYPE_START_MS);

    return () => {
      window.clearTimeout(startDelay);
      if (resetDelay !== undefined) window.clearTimeout(resetDelay);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [text]);

  return (
    <span className="hero-headline-typewriter">
      <span className="hero-headline-typewriter-text">{shown}</span>
      {!done ? (
        <span className="hero-headline-cursor" aria-hidden>
          ▍
        </span>
      ) : null}
    </span>
  );
}

type Props = {
  brandName: string;
  headlineLine1: string;
  headlineLine2: string;
};

export function HeroBrand({ brandName, headlineLine1, headlineLine2 }: Props) {
  const letters = [...brandName];

  return (
    <div className="hero-brand">
      <div className="hero-brand-logo-wrap">
        <span className="hero-brand-ring hero-brand-ring--outer" aria-hidden />
        <span className="hero-brand-ring hero-brand-ring--inner" aria-hidden />
        <div className="hero-brand-logo">
          <XopcLogoMark />
        </div>
      </div>

      <h1 className="hero-wordmark" aria-label={brandName}>
        {letters.map((char, index) => (
          <span
            key={`${char}-${index}`}
            className="hero-wordmark-char"
            style={{ "--char-delay": `${580 + index * 90}ms` } as CSSProperties}
          >
            {char}
          </span>
        ))}
      </h1>

      <p className="hero-headline">
        {headlineLine1.trim() ? <span className="hero-headline-line1">{headlineLine1}</span> : null}
        {headlineLine2.trim() ? (
          <span className="hero-headline-line2">
            <HeroTypewriter text={headlineLine2} />
          </span>
        ) : null}
      </p>
    </div>
  );
}
