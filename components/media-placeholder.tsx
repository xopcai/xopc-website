"use client";

import Image from "next/image";
import { Film, ImageIcon, Monitor, Smartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n/config";
import { localeMediaCandidates } from "@/lib/locale-media";
import type { LandingMediaSlot } from "@/lib/landing-media";

type Variant = "screenshot" | "video" | "mobile" | "avatar";

function useLocaleMediaSrc(slot: LandingMediaSlot, locale: Locale) {
  const candidates = useMemo(
    () => localeMediaCandidates(slot, locale),
    [slot.basePath, slot.ext, slot.localized, locale],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [locale, slot.basePath, slot.ext, slot.localized]);

  const src = candidates[Math.min(index, candidates.length - 1)] ?? candidates[0]!;
  const onError = useCallback(() => {
    setIndex((current) => (current < candidates.length - 1 ? current + 1 : current));
  }, [candidates.length]);

  return { src, onError };
}

function PlaceholderIcon({ variant }: { variant: Variant }) {
  const cls = "media-placeholder-icon";
  if (variant === "video") return <Film className={cls} strokeWidth={1.5} aria-hidden />;
  if (variant === "mobile") return <Smartphone className={cls} strokeWidth={1.5} aria-hidden />;
  if (variant === "avatar") return <ImageIcon className={cls} strokeWidth={1.5} aria-hidden />;
  return <Monitor className={cls} strokeWidth={1.5} aria-hidden />;
}

type Props = {
  slot: LandingMediaSlot;
  locale: Locale;
  alt: string;
  className?: string;
  variant?: Variant;
  /** Shown inside placeholder — usually from i18n */
  placeholderTitle: string;
  placeholderAction?: string;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
};

export function MediaPlaceholder({
  slot,
  locale,
  alt,
  className = "",
  variant = "screenshot",
  placeholderTitle,
  placeholderAction = "Replace asset",
  sizes,
  priority,
  unoptimized,
}: Props) {
  const { src, onError } = useLocaleMediaSrc(slot, locale);

  if (slot.ready) {
    return (
      <Image
        key={src}
        className={className}
        src={src}
        alt={alt}
        width={slot.width}
        height={slot.height}
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized ?? slot.ext === "jpg"}
        onError={onError}
      />
    );
  }

  return (
    <div
      className={`media-placeholder media-placeholder--${variant} ${className}`.trim()}
      role="img"
      aria-label={`${placeholderTitle} — ${placeholderAction}: ${slot.fileHint} (${slot.spec})`}
    >
      <div className="media-placeholder-inner">
        <PlaceholderIcon variant={variant} />
        <p className="media-placeholder-title">{placeholderTitle}</p>
        <p className="media-placeholder-spec">{slot.spec}</p>
        <code className="media-placeholder-file">public{src}</code>
      </div>
    </div>
  );
}

type VideoPlaceholderProps = {
  slot: LandingMediaSlot;
  locale: Locale;
  className?: string;
  placeholderTitle: string;
  placeholderAction?: string;
  ariaLabel: string;
  controls?: boolean;
  poster?: string;
};

export function VideoMediaSlot({
  slot,
  locale,
  className = "",
  placeholderTitle,
  placeholderAction = "Replace asset",
  ariaLabel,
  controls = true,
  poster,
}: VideoPlaceholderProps) {
  const { src, onError } = useLocaleMediaSrc(slot, locale);

  if (slot.ready) {
    return (
      <video
        key={src}
        className={className}
        controls={controls}
        playsInline
        preload="metadata"
        aria-label={ariaLabel}
        poster={poster}
        onError={onError}
      >
        <source src={src} type="video/mp4" />
      </video>
    );
  }

  return (
    <div
      className={`media-placeholder media-placeholder--video ${className}`.trim()}
      role="img"
      aria-label={`${placeholderTitle} — ${placeholderAction}: ${slot.fileHint} (${slot.spec})`}
    >
      <div className="media-placeholder-inner">
        <Film className="media-placeholder-icon" strokeWidth={1.5} aria-hidden />
        <p className="media-placeholder-title">{placeholderTitle}</p>
        <p className="media-placeholder-spec">{slot.spec}</p>
        <code className="media-placeholder-file">public{src}</code>
      </div>
    </div>
  );
}
