"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

import { applyTheme, resolveThemePreference } from "@/lib/theme";

/**
 * Re-applies `data-theme` on the document after navigations.
 * Without this, React may reconcile <html> and drop attributes not present in JSX,
 * which clears `data-theme` and invalidates every `var(--edge-bright)` border/color.
 */
export function ThemeDocumentSync() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    applyTheme(resolveThemePreference());
  }, [pathname]);
  return null;
}
