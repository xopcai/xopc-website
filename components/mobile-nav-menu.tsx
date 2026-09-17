"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Download, Github, Home, Map, Menu, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { AnimatedRouteLink } from "@/components/animated-route-link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { XopcLogoMark } from "@/components/xopc-logo-mark";
import { docBaseUrl, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";

const menuCopy = {
  zh: {
    open: "打开导航菜单",
    close: "关闭导航菜单",
    title: "浏览 xopc",
    subtitle: "从你想完成的事情开始",
    home: "首页",
    homeHint: "了解 xopc 如何工作",
    explore: "产品探索",
    exploreHint: "查看完整能力地图",
    cases: "使用场景",
    casesHint: "从真实任务找到开始方式",
    learn: "实战教程",
    learnHint: "跟着案例跑通第一次",
    docs: "产品文档",
    docsHint: "安装、配置与开发参考",
    download: "下载 xopc",
    github: "在 GitHub 查看源码",
  },
  en: {
    open: "Open navigation menu",
    close: "Close navigation menu",
    title: "Explore xopc",
    subtitle: "Start with what you want to get done",
    home: "Home",
    homeHint: "See how xopc works",
    explore: "Product explorer",
    exploreHint: "Browse the complete capability map",
    cases: "Use cases",
    casesHint: "Find a starting point from real work",
    learn: "Guided tutorials",
    learnHint: "Complete your first workflow step by step",
    docs: "Documentation",
    docsHint: "Installation, configuration, and developer reference",
    download: "Download xopc",
    github: "View source on GitHub",
  },
} as const;

export function MobileNavMenu({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const text = menuCopy[locale];
  const messages = getMessages(locale);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => setOpen(false);
  const items = [
    { href: `/${locale}`, label: text.home, hint: text.homeHint, icon: Home, active: pathname === `/${locale}` },
    { href: `/${locale}/product-map`, label: text.explore, hint: text.exploreHint, icon: Map, active: pathname === `/${locale}/product-map` },
    { href: `/${locale}/use-cases`, label: text.cases, hint: text.casesHint, icon: Sparkles, active: pathname === `/${locale}/use-cases` },
    { href: `/${locale}/learn`, label: text.learn, hint: text.learnHint, icon: BookOpen, active: pathname === `/${locale}/learn` },
  ];

  return (
    <div className="mobile-nav-menu">
      <button className="mobile-nav-trigger" type="button" aria-label={text.open} aria-expanded={open} onClick={() => setOpen(true)}>
        <Menu strokeWidth={1.8} aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        className="mobile-nav-dialog"
        aria-label={text.title}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="mobile-nav-panel">
          <header className="mobile-nav-panel-head">
            <Link href={`/${locale}`} className="mobile-nav-brand" onClick={close}>
              <XopcLogoMark />
              <span><strong>xopc</strong><small>{text.subtitle}</small></span>
            </Link>
            <button type="button" aria-label={text.close} onClick={close}><X aria-hidden /></button>
          </header>

          <p className="mobile-nav-title">{text.title}</p>
          <div className="mobile-nav-links">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <AnimatedRouteLink
                  href={item.href}
                  className={item.active ? "is-active" : undefined}
                  aria-current={item.active ? "page" : undefined}
                  onClick={close}
                  key={item.href}
                >
                  <Icon strokeWidth={1.7} aria-hidden />
                  <span><strong>{item.label}</strong><small>{item.hint}</small></span>
                </AnimatedRouteLink>
              );
            })}
            <a href={docBaseUrl(locale)} target="_blank" rel="noopener noreferrer" onClick={close}>
              <BookOpen strokeWidth={1.7} aria-hidden />
              <span><strong>{text.docs}</strong><small>{text.docsHint}</small></span>
            </a>
          </div>

          <footer className="mobile-nav-panel-footer">
            <div className="mobile-nav-preferences">
              <span>{locale === "zh" ? "语言与外观" : "Language & appearance"}</span>
              <div>
                <LocaleSwitcher
                  locale={locale}
                  labelZh={messages.header.langZh}
                  labelEn={messages.header.langEn}
                  chooseLanguageLabel={messages.header.chooseLanguage}
                  variant="landing"
                />
                <ThemeToggle
                  variant="pill"
                  ariaLight={messages.header.themeLight}
                  ariaDark={messages.header.themeDark}
                  ariaToggle={messages.header.themeToggle}
                />
              </div>
            </div>
            <Link className="mobile-nav-download" href={`/${locale}#download`} onClick={close}><Download aria-hidden />{text.download}</Link>
            <a className="mobile-nav-github" href={LANDING_GITHUB_REPO} target="_blank" rel="noopener noreferrer" onClick={close}><Github aria-hidden />{text.github}</a>
          </footer>
        </div>
      </dialog>
    </div>
  );
}
