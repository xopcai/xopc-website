"use client";

import { useEffect } from "react";

const NAV_SECTION_IDS = ["loop", "features", "channels", "workflows", "download"];

export function LandingNavState() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".landing-page nav");
    if (!nav) return;

    const setScrolled = () => {
      nav.classList.toggle("nav--scrolled", window.scrollY > 24);
    };

    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });

    const links = new Map(
      NAV_SECTION_IDS.map((id) => [
        id,
        document.querySelector<HTMLAnchorElement>(`.landing-page .nav-links a[href="#${id}"]`),
      ]),
    );
    const sections = NAV_SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (section): section is HTMLElement => section !== null,
    );
    const visibleSections = new Map<string, number>();

    const setActive = (id: string | null) => {
      for (const [linkId, link] of links) {
        link?.classList.toggle("is-active", linkId === id);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleSections.delete(entry.target.id);
          }
        }

        const active = [...visibleSections.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        setActive(active);
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("scroll", setScrolled);
      observer.disconnect();
      visibleSections.clear();
      nav.classList.remove("nav--scrolled");
      setActive(null);
    };
  }, []);

  return null;
}
