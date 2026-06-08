"use client";

import { useEffect } from "react";

/**
 * Observes `.landing-reveal` sections and adds `.is-visible` on scroll.
 * Respects prefers-reduced-motion.
 */
export function LandingScrollReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>(".landing-reveal");
    if (nodes.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return null;
}
