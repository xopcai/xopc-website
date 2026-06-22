"use client";

import Image from "next/image";
import { Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import type { Locale } from "@/lib/i18n/config";
import type { LandingMediaSlot } from "@/lib/landing-media";
import { DEFAULT_THEME, type Theme } from "@/lib/theme";
import { themeLocaleMediaCandidates } from "@/lib/theme-media";

function readTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const value = document.documentElement.getAttribute("data-theme");
  if (value === "light" || value === "dark") return value;
  return DEFAULT_THEME;
}

function subscribeTheme(callback: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function useThemeMediaSrc(slot: LandingMediaSlot, locale: Locale) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => DEFAULT_THEME);
  const candidates = useMemo(
    () => themeLocaleMediaCandidates(slot, locale, theme),
    [slot, locale, theme],
  );
  const [index, setIndex] = useState(0);

  const src = candidates[Math.min(index, candidates.length - 1)] ?? candidates[0]!;
  const onError = useCallback(() => {
    setIndex((current) => (current < candidates.length - 1 ? current + 1 : current));
  }, [candidates.length]);

  return { src, onError };
}

type Props = {
  slot: LandingMediaSlot;
  locale: Locale;
  alt: string;
  expandLabel: string;
  closeLabel: string;
};

export function ArchitectureDiagram({ slot, locale, alt, expandLabel, closeLabel }: Props) {
  const { src, onError } = useThemeMediaSrc(slot, locale);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  return (
    <>
      <figure className="arch-diagram">
        <button
          type="button"
          className="arch-diagram-trigger"
          onClick={() => setExpanded(true)}
          aria-label={expandLabel}
        >
          <Image
            key={src}
            src={src}
            width={slot.width}
            height={slot.height}
            alt={alt}
            sizes="100vw"
            className="arch-diagram-image"
            unoptimized
            onError={onError}
          />
          <span className="arch-diagram-expand" aria-hidden>
            <Maximize2 strokeWidth={1.75} />
          </span>
        </button>
      </figure>

      {expanded ? (
        <div
          className="arch-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setExpanded(false)}
        >
          <button type="button" className="arch-lightbox-close" onClick={() => setExpanded(false)} aria-label={closeLabel}>
            <X strokeWidth={1.75} aria-hidden />
          </button>
          <div className="arch-lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <Image
              key={`${src}-expanded`}
              src={src}
              width={slot.width}
              height={slot.height}
              alt={alt}
              sizes="100vw"
              className="arch-lightbox-image"
              unoptimized
              onError={onError}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
