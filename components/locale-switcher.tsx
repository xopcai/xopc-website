"use client";

import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ChevronDown, Languages } from "lucide-react";
import { usePathname } from "next/navigation";

import type { Locale } from "@/lib/i18n/config";

/** Strip locale prefix; full navigation needs a stable path tail (handles trailing slash). */
function pathWithoutLocale(pathname: string | null): string {
  const p = (pathname ?? "/").replace(/\/$/, "") || "/";
  const m = p.match(/^\/(zh|en)(\/.*)?$/);
  if (!m) return "/";
  return m[2] ?? "/";
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function startLocaleNavigation(event: ReactMouseEvent<HTMLAnchorElement>, locale: Locale, href: string) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  setLocaleCookie(locale);

  const target = new URL(href, window.location.href);
  if (target.pathname === window.location.pathname) {
    return;
  }

  try {
    sessionStorage.setItem("xopc-locale-transition", "1");
    sessionStorage.setItem("xopc-locale-transition-scroll-y", String(window.scrollY));
  } catch {
    /* ignore */
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) {
    document.documentElement.classList.add("xopc-locale-transition-out");
  }
  window.setTimeout(() => {
    window.location.assign(href);
  }, reducedMotion ? 0 : 180);
}

function LocaleDropdownLanding({
  locale,
  labelZh,
  labelEn,
  chooseLanguageLabel,
  zhHref,
  enHref,
}: {
  locale: Locale;
  labelZh: string;
  labelEn: string;
  chooseLanguageLabel: string;
  zhHref: string;
  enHref: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={rootRef} className="locale-switcher-landing">
      <button
        type="button"
        className="locale-switcher-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={chooseLanguageLabel}
        data-open={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Languages className="locale-switcher-trigger-ic" strokeWidth={1.75} aria-hidden />
        <ChevronDown className={`locale-switcher-chevron${open ? " locale-switcher-chevron--open" : ""}`} strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <div id={listId} className="locale-switcher-panel" role="listbox" aria-label={chooseLanguageLabel}>
          {/* Use native <a> so the browser does a full load; client <Link> can reuse RSC cache and leave UI stuck in the old locale. */}
          <a
            href={enHref}
            hrefLang="en"
            role="option"
            aria-selected={locale === "en"}
            className={locale === "en" ? "is-active" : undefined}
            onClick={(event) => {
              startLocaleNavigation(event, "en", enHref);
              setOpen(false);
            }}
          >
            {labelEn}
          </a>
          <a
            href={zhHref}
            hrefLang="zh-CN"
            role="option"
            aria-selected={locale === "zh"}
            className={locale === "zh" ? "is-active" : undefined}
            onClick={(event) => {
              startLocaleNavigation(event, "zh", zhHref);
              setOpen(false);
            }}
          >
            {labelZh}
          </a>
        </div>
      ) : null}
    </div>
  );
}

export function LocaleSwitcher({
  locale,
  labelZh,
  labelEn,
  chooseLanguageLabel,
  variant = "default",
}: {
  locale: Locale;
  labelZh: string;
  labelEn: string;
  /** Shown in aria-label for the language control (landing dropdown). */
  chooseLanguageLabel?: string;
  variant?: "default" | "landing";
}) {
  const pathname = usePathname();
  const suffix = pathWithoutLocale(pathname);
  const pathTail = suffix === "/" ? "" : suffix;
  const zhHref = `/zh${pathTail}`;
  const enHref = `/en${pathTail}`;

  if (variant === "landing") {
    return (
      <LocaleDropdownLanding
        locale={locale}
        labelZh={labelZh}
        labelEn={labelEn}
        chooseLanguageLabel={chooseLanguageLabel ?? "Language"}
        zhHref={zhHref}
        enHref={enHref}
      />
    );
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-zinc-300 bg-zinc-100 p-0.5 text-xs font-medium dark:border-zinc-600 dark:bg-zinc-900">
      <a
        href={zhHref}
        onClick={(event) => startLocaleNavigation(event, "zh", zhHref)}
        data-active={locale === "zh"}
        className={`rounded-full px-2 py-1 transition-colors duration-150 ${
          locale === "zh"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`}
        hrefLang="zh-CN"
      >
        {labelZh}
      </a>
      <a
        href={enHref}
        onClick={(event) => startLocaleNavigation(event, "en", enHref)}
        data-active={locale === "en"}
        className={`rounded-full px-2 py-1 transition-colors duration-150 ${
          locale === "en"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`}
        hrefLang="en"
      >
        {labelEn}
      </a>
    </div>
  );
}
