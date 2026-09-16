"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { trackProductEvent } from "@/lib/product-events";

export function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    trackProductEvent("page_viewed");
  }, [pathname]);

  return null;
}
