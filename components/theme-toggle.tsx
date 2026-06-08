"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import { applyTheme, DEFAULT_THEME, type Theme } from "@/lib/theme";

function readTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const a = document.documentElement.getAttribute("data-theme");
  if (a === "light" || a === "dark") return a;
  return DEFAULT_THEME;
}

function subscribeTheme(callback: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => {
    observer.disconnect();
    mq.removeEventListener("change", callback);
  };
}

export function ThemeToggle({
  ariaLight,
  ariaDark,
  ariaToggle,
  variant = "icon",
}: {
  ariaLight: string;
  ariaDark: string;
  ariaToggle: string;
  variant?: "icon" | "pill";
}) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark" as Theme);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
  }, [theme]);

  if (variant === "pill") {
    const isLight = theme === "light";
    return (
      <button
        type="button"
        className="theme-toggle-pill"
        suppressHydrationWarning
        onClick={toggle}
        role="switch"
        aria-checked={isLight}
        aria-label={ariaToggle}
        title={isLight ? ariaDark : ariaLight}
      >
        <span className="theme-toggle-pill-track" aria-hidden>
          <span className="theme-toggle-pill-thumb" data-theme={theme}>
            {theme === "dark" ? (
              <Moon className="theme-toggle-pill-thumb-ic" strokeWidth={2} aria-hidden />
            ) : (
              <Sun className="theme-toggle-pill-thumb-ic" strokeWidth={2} aria-hidden />
            )}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      suppressHydrationWarning
      onClick={toggle}
      aria-label={ariaToggle}
      title={theme === "dark" ? ariaLight : ariaDark}
    >
      {theme === "dark" ? (
        <Sun className="theme-toggle-icon" strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon className="theme-toggle-icon" strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}
