import Image from "next/image";

import { BRAND_MEDIA } from "@/lib/brand-media";

/** viewBox ~71×71 in source SVGs */
const LOGO_WH = 71;

/**
 * Renders both theme variants; visibility is toggled via `html[data-theme]` in CSS
 * (see `app/landing.css` `.xopc-logo-img--light` / `--dark`).
 */
export function XopcLogoMark({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={className ?? "xopc-logo-mark"} aria-hidden>
      <Image
        src={`${BRAND_MEDIA.logo.basePath}.${BRAND_MEDIA.logo.ext}`}
        alt=""
        width={LOGO_WH}
        height={LOGO_WH}
        className="xopc-logo-img xopc-logo-img--light"
        priority={priority}
        unoptimized
      />
      <Image
        src={`${BRAND_MEDIA.logoDark.basePath}.${BRAND_MEDIA.logoDark.ext}`}
        alt=""
        width={LOGO_WH}
        height={LOGO_WH}
        className="xopc-logo-img xopc-logo-img--dark"
        priority={priority}
        unoptimized
      />
    </span>
  );
}
