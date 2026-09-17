"use client";

import Link from "next/link";
import { type ComponentProps, type MouseEvent } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

const OUT_CLASS = "xopc-route-transition-out";

export function AnimatedRouteLink({
  href,
  onClick,
  ...props
}: Props) {
  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = new URL(href, window.location.href);
    if (target.origin !== window.location.origin) return;
    if (`${target.pathname}${target.search}${target.hash}` === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;

    const root = document.documentElement;
    if (root.classList.contains(OUT_CLASS)) return;

    root.classList.add(OUT_CLASS);

    // Let Next handle the navigation and prefetching. This class only adds a
    // short opacity cue, avoiding a second route transition and full-page
    // transform layer.
    window.setTimeout(() => {
      root.classList.remove(OUT_CLASS);
    }, 3000);
  };

  return <Link href={href} onClick={navigate} {...props} />;
}
