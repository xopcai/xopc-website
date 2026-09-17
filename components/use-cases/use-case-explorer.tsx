"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  FileCheck2,
  Search,
  ShieldCheck,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react";

import { XopcLogoMark } from "@/components/xopc-logo-mark";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/lib/i18n/config";
import { localized, useCaseCategories, useCases, type UseCaseCategory } from "@/lib/use-cases";

const copy = {
  zh: {
    back: "返回首页",
    download: "下载 xopc",
    eyebrow: "真实能力 · 即用场景",
    title: "别从功能开始。\n从你要的结果开始。",
    intro: "这些场景由 xopc 当前产品能力支持。选择一个结果，看看需要准备什么、哪里会停下来询问你，以及完成后如何证明它真的做完了。",
    stats: [
      [String(useCases.length), "个可执行场景"],
      [String(useCaseCategories.length), "类常见工作"],
      ["100%", "明确确认边界"],
    ],
    howTitle: "四步开始",
    how: ["选择一个结果", "补齐所需能力", "复制开始指令", "核对证据回执"],
    searchPlaceholder: "搜索邮件、研究、文件、代码、自动化…",
    searchLabel: "搜索使用场景",
    all: "全部",
    count: (n: number) => `${n} 个场景`,
    libraryIntro: "浏览全部案例，展开即可复制可直接运行的开始指令。",
    surprise: "随便看看",
    emptyTitle: "没有找到匹配场景",
    emptyBody: "换个关键词，或清除筛选继续浏览。",
    clear: "清除筛选",
    ready: "安装后即可开始",
    setup: "需要先准备能力",
    needs: "开始前",
    approval: "xopc 会在哪里停下来",
    outcome: "你会得到",
    evidence: "如何核验",
    related: "查看相关能力",
    openPrompt: "展开使用方式",
    closePrompt: "收起详情",
    copyPrompt: "复制指令",
    copied: "已复制",
    promptNote: "把方括号中的内容换成你的实际情况，然后发给 xopc。权限规则仍然有效。",
    trustTitle: "提示词不是权限。",
    trustBody: "即使一句话要求“全自动”，发送、删除、购买、发布和账户变更仍会服从你的工具策略和确认规则。外部网站发生变化时，xopc 应停下来报告，而不是猜着继续。",
    trustLink: "了解信任与权限",
    ctaEyebrow: "先完成一件小事",
    ctaTitle: "选一个场景，今天就跑通一次。",
    ctaBody: "第一次成功完成后，再把它保存成工作流或自动化。你不需要先学会整个产品。",
    ctaPrimary: "下载 xopc",
    ctaSecondary: "看 6 个实战教程",
    disclaimer: "这是基于产品能力整理的使用路径，不是用户评价或结果保证。外部网站、模型和连接服务的可用性会变化。",
  },
  en: {
    back: "Back home",
    download: "Get xopc",
    eyebrow: "REAL CAPABILITIES · READY-TO-TRY SCENARIOS",
    title: "Don't start with features.\nStart with what you need done.",
    intro: "Every scenario here is backed by current xopc capabilities. Pick an outcome, see what it needs, where xopc will pause for you, and what proves the work is actually complete.",
    stats: [
      [String(useCases.length), "actionable scenarios"],
      [String(useCaseCategories.length), "common work areas"],
      ["100%", "explicit approval boundaries"],
    ],
    howTitle: "Start in four steps",
    how: ["Choose an outcome", "Prepare capabilities", "Copy the starter", "Review the evidence"],
    searchPlaceholder: "Search email, research, files, code, automation…",
    searchLabel: "Search use cases",
    all: "All",
    count: (n: number) => `${n} ${n === 1 ? "scenario" : "scenarios"}`,
    libraryIntro: "Browse every scenario, then expand one for a ready-to-run starter prompt.",
    surprise: "Surprise me",
    emptyTitle: "No matching scenarios",
    emptyBody: "Try another term or clear the filters to keep browsing.",
    clear: "Clear filters",
    ready: "Ready after install",
    setup: "Capability setup needed",
    needs: "Before you start",
    approval: "Where xopc pauses",
    outcome: "What you get",
    evidence: "How to verify it",
    related: "Explore capabilities",
    openPrompt: "Open the playbook",
    closePrompt: "Hide details",
    copyPrompt: "Copy prompt",
    copied: "Copied",
    promptNote: "Replace the brackets with your situation, then send it to xopc. Your permission rules still apply.",
    trustTitle: "A prompt is not permission.",
    trustBody: "Even when a request says “fully automate this,” sending, deleting, purchasing, publishing, and account changes still follow your tool policy and confirmation rules. If an external site changes, xopc should stop and report rather than guess.",
    trustLink: "Explore trust and permissions",
    ctaEyebrow: "COMPLETE ONE SMALL THING",
    ctaTitle: "Pick a scenario and run it once today.",
    ctaBody: "After one successful run, save it as a workflow or automation. You do not need to learn the whole product first.",
    ctaPrimary: "Download xopc",
    ctaSecondary: "Try 6 guided tutorials",
    disclaimer: "These are capability-backed usage paths, not testimonials or outcome guarantees. External websites, models, and connected services can change.",
  },
} as const;

export function UseCaseExplorer({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const header = locale === "zh"
    ? { choose: "选择语言", zh: "简体中文", en: "English", light: "切换到浅色主题", dark: "切换到深色主题", toggle: "切换浅色 / 深色主题" }
    : { choose: "Choose language", zh: "简体中文", en: "English", light: "Switch to light theme", dark: "Switch to dark theme", toggle: "Toggle light or dark theme" };
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<UseCaseCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleCases = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    return useCases.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!normalized) return true;
      const categoryCopy = useCaseCategories.find((entry) => entry.id === item.category);
      const haystack = [
        localized(item.title, locale),
        localized(item.summary, locale),
        localized(item.outcome, locale),
        localized(item.prompt, locale),
        categoryCopy ? localized(categoryCopy.label, locale) : "",
        ...item.setup.map((entry) => localized(entry, locale)),
      ].join(" ").toLocaleLowerCase(locale);
      return haystack.includes(normalized);
    }).sort((left, right) => {
      return useCaseCategories.findIndex((entry) => entry.id === left.category)
        - useCaseCategories.findIndex((entry) => entry.id === right.category);
    });
  }, [category, locale, query]);

  const copyPrompt = async (id: string, prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => current === id ? null : current), 1800);
  };

  const reset = () => {
    setQuery("");
    setCategory("all");
  };

  const surpriseMe = () => {
    if (!visibleCases.length) return;
    const next = visibleCases[Math.floor(Math.random() * visibleCases.length)];
    setOpenId(next.id);
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(`use-case-${next.id}`)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  };

  return (
    <div className="landing-page product-atlas use-cases-page">
      <header className="pm-header use-cases-header">
        <MobileNavMenu locale={locale} />
        <Link className="pm-brand" href={`/${locale}`} aria-label="xopc">
          <XopcLogoMark />
          <b>xopc</b>
        </Link>
        <Link className="pm-home" href={`/${locale}`}>
          <ArrowRight className="use-cases-back-icon" size={16} />
          {text.back}
        </Link>
        <div className="pm-header-tools">
          <LocaleSwitcher locale={locale} labelZh={header.zh} labelEn={header.en} chooseLanguageLabel={header.choose} variant="landing" />
          <ThemeToggle ariaLight={header.light} ariaDark={header.dark} ariaToggle={header.toggle} variant="pill" />
          <Link className="pm-primary" href={`/${locale}#download`}>{text.download}</Link>
        </div>
      </header>

      <main>
        <section className="use-cases-hero">
          <div className="use-cases-hero-glow" aria-hidden />
          <div className="use-cases-shell use-cases-hero-grid">
            <div className="use-cases-hero-copy">
              <p className="use-cases-eyebrow"><Sparkles size={15} aria-hidden />{text.eyebrow}</p>
              <h1>{text.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
              <p className="use-cases-intro">{text.intro}</p>
            </div>
            <div className="use-cases-hero-panel" aria-label={locale === "zh" ? "页面概览" : "Page overview"}>
              <div className="use-cases-stats">
                {text.stats.map(([value, label]) => (
                  <div key={label}><strong>{value}</strong><span>{label}</span></div>
                ))}
              </div>
              <div className="use-cases-how">
                <p>{text.howTitle}</p>
                <ol>{text.how.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
              </div>
            </div>
          </div>
        </section>

        <section className="use-cases-library use-cases-shell" aria-labelledby="use-cases-library-title">
          <div className="use-cases-library-heading">
            <div>
              <p className="use-cases-eyebrow"><Clipboard size={15} aria-hidden />{locale === "zh" ? "场景库" : "SCENARIO LIBRARY"}</p>
              <h2 id="use-cases-library-title">{locale === "zh" ? "找到与你今天最接近的一件事。" : "Find the closest thing to your work today."}</h2>
              <p className="use-cases-library-intro">{text.libraryIntro}</p>
            </div>
            <button className="use-cases-surprise" type="button" onClick={surpriseMe} disabled={!visibleCases.length}>
              <Shuffle size={16} aria-hidden />
              {text.surprise}
            </button>
          </div>

          <div className="use-cases-controls">
            <div className="use-cases-search-row">
              <label className="use-cases-search">
                <Search size={19} aria-hidden />
                <span className="sr-only">{text.searchLabel}</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.searchPlaceholder} type="search" />
                {query ? <button type="button" onClick={() => setQuery("")} aria-label={text.clear}><X size={17} /></button> : null}
              </label>
              <span className="use-cases-result-count" aria-live="polite">{text.count(visibleCases.length)}</span>
            </div>
            <div className="use-cases-filters" role="group" aria-label={locale === "zh" ? "场景分类" : "Scenario categories"}>
              <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>{text.all}<span>{useCases.length}</span></button>
              {useCaseCategories.map((item) => (
                <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>
                  {localized(item.label, locale)}
                  <span>{useCases.filter((entry) => entry.category === item.id).length}</span>
                </button>
              ))}
            </div>
          </div>

          {visibleCases.length ? (
            <div className="use-cases-list">
              {visibleCases.map((item, index) => {
                const categoryCopy = useCaseCategories.find((entry) => entry.id === item.category)!;
                const open = openId === item.id;
                const copied = copiedId === item.id;
                return (
                  <article className={`use-case-row ${open ? "is-open" : ""}`} id={`use-case-${item.id}`} key={item.id}>
                    <span className="use-case-index">{String(index + 1).padStart(2, "0")}</span>
                    <div className="use-case-identity">
                      <div className="use-case-meta">
                        <span className="use-case-category">{localized(categoryCopy.label, locale)}</span>
                        <span className={`use-case-readiness ${item.setup.length ? "needs-setup" : "is-ready"}`}>
                          {item.setup.length ? text.setup : text.ready}
                        </span>
                      </div>
                      <h3>{localized(item.title, locale)}</h3>
                      <div className="use-case-links">
                        {item.productNodes.slice(0, 3).map((node) => (
                          <Link href={`/${locale}/product-map?node=${node}`} key={node}>{node}<ArrowRight size={12} /></Link>
                        ))}
                      </div>
                    </div>
                    <div className="use-case-overview">
                      <p className="use-case-summary">{localized(item.summary, locale)}</p>
                      <p className="use-case-outcome"><CheckCircle2 size={15} aria-hidden /><span><strong>{text.outcome}</strong>{localized(item.outcome, locale)}</span></p>
                      <button className="use-case-prompt-toggle" type="button" aria-expanded={open} aria-controls={`use-case-details-${item.id}`} onClick={() => setOpenId(open ? null : item.id)}>
                        {open ? text.closePrompt : text.openPrompt}
                        <ArrowRight size={15} aria-hidden />
                      </button>
                    </div>
                    {open ? (
                      <div className="use-case-details" id={`use-case-details-${item.id}`}>
                        <div className="use-case-facts">
                          {item.setup.length ? <div><Sparkles size={16} aria-hidden /><div><strong>{text.needs}</strong><ul>{item.setup.map((entry) => <li key={localized(entry, locale)}>{localized(entry, locale)}</li>)}</ul></div></div> : null}
                          <div><ShieldCheck size={16} aria-hidden /><div><strong>{text.approval}</strong><p>{localized(item.approval, locale)}</p></div></div>
                          <div><FileCheck2 size={16} aria-hidden /><div><strong>{text.evidence}</strong><ul>{item.evidence.map((entry) => <li key={localized(entry, locale)}>{localized(entry, locale)}</li>)}</ul></div></div>
                        </div>
                        <div className="use-case-prompt">
                          <div className="use-case-prompt-head"><span>{locale === "zh" ? "发给 xopc" : "SEND TO XOPC"}</span><button type="button" onClick={() => void copyPrompt(item.id, localized(item.prompt, locale))}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? text.copied : text.copyPrompt}</button></div>
                          <p>{localized(item.prompt, locale)}</p>
                          <small>{text.promptNote}</small>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="use-cases-empty">
              <Search size={34} aria-hidden />
              <h3>{text.emptyTitle}</h3>
              <p>{text.emptyBody}</p>
              <button type="button" onClick={reset}>{text.clear}</button>
            </div>
          )}
        </section>

        <section className="use-cases-trust use-cases-shell">
          <ShieldCheck size={30} aria-hidden />
          <div><h2>{text.trustTitle}</h2><p>{text.trustBody}</p></div>
          <Link href={`/${locale}/product-map?node=permissions`}>{text.trustLink}<ArrowRight size={16} /></Link>
        </section>

        <section className="use-cases-cta">
          <div className="use-cases-shell">
            <p className="use-cases-eyebrow">{text.ctaEyebrow}</p>
            <h2>{text.ctaTitle}</h2>
            <p>{text.ctaBody}</p>
            <div><Link className="use-cases-primary" href={`/${locale}#download`}>{text.ctaPrimary}<ArrowRight size={17} /></Link><Link className="use-cases-secondary" href={`/${locale}/learn`}>{text.ctaSecondary}</Link></div>
            <small>{text.disclaimer}</small>
          </div>
        </section>
      </main>
    </div>
  );
}
