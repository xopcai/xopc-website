"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, type MouseEvent, useEffect } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  direction?: "forward" | "back";
};

const OUT_CLASS = "xopc-route-transition-out";
const IN_CLASS = "xopc-route-transition-in";

export function AnimatedRouteLink({
  href,
  direction = "forward",
  onClick,
  ...props
}: Props) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

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
    root.classList.remove(IN_CLASS);
    root.classList.add(OUT_CLASS);

    // Let the pressed state and exit motion paint, then navigate immediately.
    // A single frame keeps the interaction responsive without delaying the route.
    window.requestAnimationFrame(() => {
      router.push(`${target.pathname}${target.search}${target.hash}`);
    });

    // Recover if a route request fails before the pathname changes.
    window.setTimeout(() => {
      root.classList.remove(OUT_CLASS, "xopc-route-transition-in");
      delete root.dataset.xopcRouteDirection;
    }, 3000);
  };

  return <Link href={href} onClick={navigate} {...props} />;
}
