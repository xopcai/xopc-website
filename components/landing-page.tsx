import {
  ArrowRight,
  Check,
  FileText,
  Folder,
  MessageSquare,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { LandingFooter } from "@/components/landing-footer";
import { LandingAnalytics } from "@/components/landing-analytics";
import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { ProductDesktopDownloads } from "@/components/product-desktop-downloads";
import { SiteHeader } from "@/components/site-header";
import { courses } from "@/components/learn/courses";
import catalog from "@/content/tutorials/catalog.json";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";

type Props = { locale: Locale; messages: Messages; docHome: string };
export function LandingPage({ locale, messages: m, docHome }: Props) {
  const zh = locale === "zh",
    L = m.landing;
  const steps = zh
    ? ["带入材料", "一起推进", "留下结果"]
    : ["Bring the context", "Move it forward", "Keep the result"];
  return (
    <div className="landing-page site-page site-home">
      <LandingAnalytics />
      <LandingLocaleTransition />
      <SiteHeader locale={locale} active="home" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "xopc",
            applicationCategory: "ProductivityApplication",
            operatingSystem: "macOS, Windows, Linux",
            description: m.meta.description,
            downloadUrl: `https://xopc.ai/${locale}#download`,
            sameAs: [LANDING_GITHUB_REPO],
          }).replace(/</g, "\\u003c"),
        }}
      />
      <section className="site-hero" aria-labelledby="site-hero-title">
        <p className="site-kicker">
          {zh ? "你的个人 AI 助理" : "Your personal AI assistant"}
        </p>
        <h1 id="site-hero-title">
          {zh ? (
            <>
              让重要的事，
              <br />
              持续向前。
            </>
          ) : (
            <>
              Keep what matters
              <br />
              moving.
            </>
          )}
        </h1>
        <p className="site-hero-caption">
          {zh
            ? "从一个想法，到可以继续的工作。"
            : "From a thought to work you can build on."}
        </p>
        <div className="site-actions">
          <a
            className="site-button"
            href="#download"
            data-product-event="hero_download_clicked"
          >
            {zh ? "下载 xopc" : "Get xopc"}
          </a>
          <a className="site-text-link" href={`/${locale}/learn`}>
            {zh ? "看看怎么用" : "See it in action"}
            <ArrowRight size={17} />
          </a>
        </div>
        <figure className="site-product-film">
          <video
            width={1620}
            height={1080}
            controls
            playsInline
            preload="metadata"
            aria-label={zh ? "xopc 桌面演示" : "xopc desktop demo"}
            poster="/media/product/xopc-desktop-poster.jpg"
          >
            <source src="/media/product/xopc-desktop.mp4" type="video/mp4" />
          </video>
          <figcaption>{zh ? "xopc 桌面端" : "xopc for desktop"}</figcaption>
        </figure>
      </section>
      <section
        className="site-section site-workflow"
        id="why"
        aria-labelledby="workflow-title"
      >
        <div className="site-section-heading">
          <p className="site-kicker">
            {zh ? "工作，自然接着往下走" : "A natural way to work"}
          </p>
          <h2 id="workflow-title">
            {zh ? "不止一次对话。" : "Beyond a single conversation."}
          </h2>
        </div>
        <div className="site-flow" id="loop">
          {steps.map((title, index) => (
            <article className="site-flow-step" key={title}>
              <span className="site-step-number">0{index + 1}</span>
              <h3>{title}</h3>
              <div className={`site-flow-visual site-flow-${index}`}>
                {index === 0 ? (
                  <>
                    <div className="site-file">
                      <Folder size={23} />
                      <span>{zh ? "新项目" : "New project"}</span>
                    </div>
                    <div className="site-file">
                      <FileText size={23} />
                      <span>{zh ? "交接说明.md" : "handoff.md"}</span>
                    </div>
                    <Plus size={19} />
                  </>
                ) : index === 1 ? (
                  <>
                    <div className="site-message">
                      {zh ? "从哪里开始？" : "Where do we start?"}
                    </div>
                    <div className="site-reply">
                      <MessageSquare size={21} />
                      <span>
                        {zh
                          ? "先核对目标，再整理下一步。"
                          : "Check the goal. Find the next step."}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="site-result">
                      <Check size={19} />
                      {zh ? "项目概览" : "Project overview"}
                    </div>
                    <div className="site-result">
                      <Check size={19} />
                      {zh ? "交接笔记" : "Handoff note"}
                    </div>
                    <div className="site-result">
                      <span className="site-open-circle" />
                      {zh ? "下一步行动" : "Next actions"}
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
        <a
          className="site-text-link"
          href={`/${locale}/learn?course=scenario-project-handoff`}
        >
          {zh ? "跟着完成一次项目交接" : "Try a project handoff"}
          <ArrowRight size={17} />
        </a>
      </section>
      <section
        className="site-section site-scenarios"
        aria-labelledby="scenario-title"
      >
        <div className="site-section-heading site-heading-row">
          <h2 id="scenario-title">
            {zh ? "从你的工作开始。" : "Start with your work."}
          </h2>
          <a className="site-text-link" href={`/${locale}/learn`}>
            {zh ? "查看全部场景" : "All workflows"}
            <ArrowRight size={17} />
          </a>
        </div>
        <div className="site-scenario-grid">
          {[courses[1], courses[2], courses[4]].map((course) => {
            const media = catalog.tutorials.find((t) => t.id === course.id)!;
            return (
              <a
                className="site-scenario-card"
                key={course.id}
                href={`/${locale}/learn?course=${course.id}`}
              >
                <span className="site-kicker">{course[locale].audience}</span>
                <h3>{course[locale].title}</h3>
                <div className="site-scenario-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.poster} alt="" loading="lazy" />
                </div>
                <span className="site-card-link">
                  {zh ? "观看教程" : "Watch tutorial"}
                  <span className="site-plus">
                    <Plus size={18} />
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </section>
      <section className="site-section site-trust" id="trust">
        <div className="site-section-heading">
          <h2>{zh ? "由你掌握。" : "You stay in control."}</h2>
        </div>
        <div className="site-trust-grid">
          {(zh
            ? [
                ["数据在本地", "工作记录保存在自己的设备。"],
                ["模型由你选", "按需要连接云端或本地模型。"],
                ["重要的事，由你决定", "在授权范围内协作。"],
              ]
            : [
                ["Local records", "Keep your work on your device."],
                ["Your choice of model", "Connect a cloud or local model."],
                ["Your decisions", "Work within the access you allow."],
              ]
          ).map(([title, body]) => (
            <article key={title}>
              <ShieldCheck size={26} />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <a
          className="site-text-link"
          href={`/${locale}/product-map?group=trust`}
        >
          {zh ? "了解数据与权限" : "Explore data and permissions"}
          <ArrowRight size={17} />
        </a>
      </section>
      <div className="site-download-section">
        <ProductDesktopDownloads
          id="download"
          d={L.download}
          kicker={zh ? "开始使用" : "Get started"}
          title={zh ? "下一步，交给 xopc。" : "Take the next step with xopc."}
          desc="macOS · Windows · Linux"
        />
      </div>
      <div className="site-secondary-downloads">
        <a href={`/${locale}/mobile`}>
          {zh ? "移动端" : "Mobile"}
          <ArrowRight size={15} />
        </a>
        <details id="terminal-install">
          <summary>{zh ? "终端安装" : "Install from terminal"}</summary>
          <div>
            <span>{L.download.terminalUnixLabel}</span>
            <code>{L.download.terminalUnixCommand}</code>
            <span>{L.download.terminalWindowsLabel}</span>
            <code>{L.download.terminalWindowsCommand}</code>
          </div>
        </details>
        <a href={docHome}>
          {zh ? "安装帮助" : "Setup help"}
          <ArrowRight size={15} />
        </a>
      </div>
      <LandingFooter footer={L.footer} docsHref={docHome} locale={locale} />
    </div>
  );
}
