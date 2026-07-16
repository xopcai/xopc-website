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
} as const;

/**
 * Product-page media slots. Keep `ready: false` until the requested recording
 * has been added to `public/`; the page then renders a precise handoff instead
 * of implying that a placeholder is product footage.
 */
export const PRODUCT_MEDIA = {
  operator: {
    demo: slot("/media/products/worker/demo", "mp4", {
      ready: true,
      width: 1920,
      height: 1080,
      spec: "1920×1080 · 15.9s · MP4 (H.264) · desktop task completed end-to-end",
    }),
  },
  code: {
    demo: slot("/media/products/code/demo", "mp4", {
      ready: true,
      width: 1920,
      height: 1080,
      spec: "1920×1080 · 15.2s · MP4 (H.264) · request → diff → verification",
    }),
  },
  gateway: {
    demo: slot("/media/products/gateway/demo", "mp4", {
      ready: true,
      width: 1920,
      height: 1080,
      spec: "1920×1080 · 16.6s · MP4 (H.264) · runtime → channel/API → client response",
    }),
  },
} as const;

export type ProductMediaId = keyof typeof PRODUCT_MEDIA;

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
