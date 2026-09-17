"use client";

import Link from "next/link";

import { XopcLogoMark } from "@/components/xopc-logo-mark";

type Props = {
  locale: string;
  ariaLabel: string;
};

export function LogoHomeLink({ locale, ariaLabel }: Props) {
  return (
    <Link
      href={`/${locale}`}
      className="xopc-logo-link"
      aria-label={ariaLabel}
      onClick={() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }}
    >
      <XopcLogoMark />
    </Link>
  );
}
