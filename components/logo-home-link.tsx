"use client";

import Link from "next/link";

import { XopcLogoMark } from "@/components/xopc-logo-mark";

type Props = {
  locale: string;
  ariaLabel: string;
  transitionTypes?: string[];
};

export function LogoHomeLink({ locale, ariaLabel, transitionTypes }: Props) {
  return (
    <Link
      href={`/${locale}`}
      className="xopc-logo-link"
      aria-label={ariaLabel}
      transitionTypes={transitionTypes}
      onClick={() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }}
    >
      <XopcLogoMark />
    </Link>
  );
}
