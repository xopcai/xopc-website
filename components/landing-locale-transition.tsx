"use client";

import { useEffect } from "react";

const TRANSITION_KEY = "xopc-locale-transition";
const SCROLL_KEY = "xopc-locale-transition-scroll-y";

export function LandingLocaleTransition() {
  useEffect(() => {
    let timeoutId: number | undefined;

    try {
      if (sessionStorage.getItem(TRANSITION_KEY) !== "1") return;

      const root = document.documentElement;
      const rawScrollY = sessionStorage.getItem(SCROLL_KEY);
      const scrollY = rawScrollY === null ? NaN : Number(rawScrollY);
      const previousScrollRestoration = history.scrollRestoration;

      history.scrollRestoration = "manual";

      requestAnimationFrame(() => {
        if (Number.isFinite(scrollY)) {
          window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
        }

        requestAnimationFrame(() => {
          root.classList.add("xopc-locale-transition-ready");
          timeoutId = window.setTimeout(() => {
            root.classList.remove("xopc-locale-transition-in", "xopc-locale-transition-ready");
            sessionStorage.removeItem(TRANSITION_KEY);
            sessionStorage.removeItem(SCROLL_KEY);
            history.scrollRestoration = previousScrollRestoration;
          }, 360);
        });
      });
    } catch {
      document.documentElement.classList.remove("xopc-locale-transition-in", "xopc-locale-transition-ready");
    }

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
