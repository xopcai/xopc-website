"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, type MouseEvent } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  direction?: "forward" | "back";
};

const OUT_CLASS = "xopc-route-transition-out";

export function AnimatedRouteLink({
  href,
  direction = "forward",
  onClick,
  ...props
}: Props) {
  const router = useRouter();

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

    event.preventDefault();
    const root = document.documentElement;
    if (root.classList.contains(OUT_CLASS)) return;

    root.dataset.xopcRouteDirection = direction;
    root.classList.add(OUT_CLASS);

    window.setTimeout(() => {
      router.push(`${target.pathname}${target.search}${target.hash}`);
    }, 190);

    // Recover if a route request fails before the pathname changes.
    window.setTimeout(() => {
      root.classList.remove(OUT_CLASS, "xopc-route-transition-in");
      delete root.dataset.xopcRouteDirection;
    }, 5000);
  };

  return <Link href={href} onClick={navigate} {...props} />;
}
