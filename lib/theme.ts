export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "xopc-theme";

export function applyTheme(t: Theme): void {
  document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, t);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return null;
}

/** Default theme when the user has not chosen one (landing defaults to dark). */
export const DEFAULT_THEME: Theme = "dark";

export function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveThemePreference(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  return DEFAULT_THEME;
}
