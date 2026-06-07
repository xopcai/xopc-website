"use client";

import { useEffect, useState } from "react";

const TYPE_MS = 82;
const START_DELAY_MS = 420;

type Props = {
  titleLine1Before: string;
  titleLine1Highlight: string;
  titleLine1After: string;
  typewriterText: string;
};

export function HeroTitle({ titleLine1Before, titleLine1Highlight, titleLine1After, typewriterText }: Props) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(typewriterText);
      setDone(true);
      return;
    }

    setShown("");
    setDone(false);

    let intervalId: number | undefined;
    let i = 0;

    const startDelay = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        i += 1;
        setShown(typewriterText.slice(0, i));
        if (i >= typewriterText.length) {
          if (intervalId !== undefined) window.clearInterval(intervalId);
          setDone(true);
        }
      }, TYPE_MS);
    }, START_DELAY_MS);

    return () => {
      window.clearTimeout(startDelay);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [typewriterText]);

  return (
    <>
      {titleLine1Before}
      {titleLine1Highlight ? (
        <span className="hero-claw-highlight">{titleLine1Highlight}</span>
      ) : null}
      {titleLine1After}
      <br />
      <em className="hero-typewriter-line">
        <span className="hero-typewriter-text">{shown}</span>
        {!done ? (
          <span className="hero-typewriter-cursor" aria-hidden>
            ▍
          </span>
        ) : null}
      </em>
    </>
  );
}
