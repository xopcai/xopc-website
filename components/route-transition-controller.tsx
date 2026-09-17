"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const OUT_CLASS = "xopc-route-transition-out";
const IN_CLASS = "xopc-route-transition-in";

export function RouteTransitionController() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains(OUT_CLASS)) return;

    root.classList.remove(OUT_CLASS);
    root.classList.add(IN_CLASS);

    const timeoutId = window.setTimeout(() => {
      root.classList.remove(IN_CLASS);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}
