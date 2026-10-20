"use client";

import { useEffect } from "react";

import { trackProductEvent } from "@/lib/product-events";

export function LandingAnalytics() {
  useEffect(() => {
    const downloadSection = document.getElementById("download");
    const observer = downloadSection && "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries, currentObserver) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            trackProductEvent("download_section_viewed");
            currentObserver.disconnect();
          },
          { threshold: 0.2 },
        )
      : null;

    if (downloadSection && observer) observer.observe(downloadSection);

    return () => {
      observer?.disconnect();
    };
  }, []);

  return null;
}
