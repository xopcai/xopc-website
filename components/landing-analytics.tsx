"use client";

import { useEffect } from "react";

import { isProductEventName, trackProductEvent } from "@/lib/product-events";

export function LandingAnalytics() {
  useEffect(() => {
    trackProductEvent("landing_viewed");

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tracked = target.closest<HTMLElement>("[data-product-event]");
      if (!tracked) return;

      const eventName = tracked.dataset.productEvent;
      if (!isProductEventName(eventName)) return;
      trackProductEvent(eventName, { method: tracked.dataset.productMethod });
    };

    document.addEventListener("click", onClick);

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
      document.removeEventListener("click", onClick);
      observer?.disconnect();
    };
  }, []);

  return null;
}
