import { localeMediaFileHint } from "@/lib/locale-media";

/**
 * Landing page media slots. Set `ready: true` after placing assets under `public/`.
 * Localized assets use `{basePath}.{locale}.{ext}` with fallback to default locale (`zh`) then `{basePath}.{ext}`.
 */
export type LandingMediaSlot = {
  basePath: string;
  ext: string;
  /** When false, only `{basePath}.{ext}` is used */
  localized?: boolean;
  /** When false, the site renders a labeled placeholder instead of the asset */
  ready: boolean;
  width: number;
  height: number;
  /** Recommended export size shown in placeholder, e.g. "1920×1080" */
  spec: string;
  /** Filename hint for designers */
  fileHint: string;
};

function slot(
  basePath: string,
  ext: string,
  meta: Omit<LandingMediaSlot, "basePath" | "ext" | "fileHint"> & { fileHint?: string; localized?: boolean },
): LandingMediaSlot {
  const localized = meta.localized ?? true;
  return {
    basePath,
    ext,
    localized,
    ready: meta.ready,
    width: meta.width,
    height: meta.height,
    spec: meta.spec,
    fileHint: meta.fileHint ?? localeMediaFileHint(basePath, ext, localized),
  };
}

export const LANDING_MEDIA = {
  hero: {
    preview: slot("/media/landing/hero/preview", "png", {
      ready: false,
      width: 1040,
      height: 595,
      spec: "1040×595",
    }),
    loopVideo: slot("/media/landing/hero/loop", "mp4", {
      ready: false,
      width: 1920,
      height: 1080,
      spec: "1920×1080 · ≤15s · muted loop",
    }),
  },
  surfaces: {
    tui: slot("/media/landing/surfaces/tui", "png", {
      ready: true,
      width: 2316,
      height: 1370,
      spec: "2316×1370",
    }),
    web: slot("/media/landing/surfaces/web", "png", {
      ready: true,
      width: 3022,
      height: 1730,
      spec: "3022×1730",
    }),
    desktop: slot("/media/landing/surfaces/desktop", "png", {
      ready: true,
      width: 2400,
      height: 1600,
      spec: "2400×1600 · macOS window chrome",
    }),
    mobile: slot("/media/landing/surfaces/mobile", "png", {
      ready: true,
      width: 482,
      height: 1024,
      spec: "482×1024 · phone frame optional",
    }),
    telegram: slot("/media/landing/surfaces/telegram", "png", {
      ready: true,
      width: 482,
      height: 1024,
      spec: "482×1024 · Telegram chat bubbles",
    }),
    wechat: slot("/media/landing/surfaces/wechat", "png", {
      ready: true,
      width: 482,
      height: 1024,
      spec: "482×1024 · WeChat chat bubbles",
    }),
  },
  demo: {
    full: slot("/media/landing/demo/full", "mp4", {
      ready: true,
      width: 1920,
      height: 1080,
      spec: "1920×1080 · ≤5 min · H.264",
    }),
    teaser: slot("/media/landing/demo/teaser", "mp4", {
      ready: false,
      width: 1920,
      height: 1080,
      spec: "1920×1080 · ~1:45 highlight reel",
    }),
  },
  architecture: {
    diagram: slot("/media/landing/architecture/diagram", "png", {
      ready: true,
      width: 1200,
      height: 600,
      spec: "1200×600 · theme: diagram.{dark|light}.{locale}.png",
      fileHint: "architecture/diagram.{theme}.{locale}.png",
    }),
  },
  workflows: {
    console: slot("/media/landing/workflows/board", "png", {
      ready: false,
      width: 2400,
      height: 1400,
      spec: "2400×1400 · #/workflows kanban (dark theme)",
    }),
  },
  ecosystem: {
    skillsTerminal: slot("/media/landing/ecosystem/skills-terminal", "cast", {
      ready: false,
      width: 800,
      height: 400,
      spec: "asciicast · 800×400",
    }),
  },
  social: {
    testimonialAvatar: slot("/media/landing/social/testimonial-avatar", "jpg", {
      ready: false,
      width: 80,
      height: 80,
      spec: "80×80 · square crop",
    }),
  },
} as const;

export const BRAND_MEDIA = {
  logo: {
    basePath: "/brand/logo",
    ext: "svg",
    localized: false,
  },
  logoDark: {
    basePath: "/brand/logo-dark",
    ext: "svg",
    localized: false,
  },
} as const;

export type SurfaceMediaId = keyof typeof LANDING_MEDIA.surfaces;
