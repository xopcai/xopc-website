"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { isProductEventName, trackProductEvent } from "@/lib/product-events";

export function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    trackProductEvent("page_viewed");
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const tracked = event.target.closest<HTMLElement>("[data-product-event]");
      if (!tracked || !isProductEventName(tracked.dataset.productEvent)) return;
      trackProductEvent(tracked.dataset.productEvent, { method: tracked.dataset.productMethod });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
