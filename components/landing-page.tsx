import type { CSSProperties } from "react";
import {
  BookOpen,
  Bot,
  GitBranch,
  Github,
  Globe,
  HardDrive,
  KeyRound,
  Layers,
  Mic,
  Puzzle,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { HeroBrand } from "@/components/hero-brand";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { LandingScrollReveal } from "@/components/landing-scroll-reveal";
import { QuickInstallBlock } from "@/components/quick-install-block";
import { SurfaceGallery } from "@/components/surface-gallery";
import { WorkflowBoardPreview } from "@/components/workflow-board-preview";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoHomeLink } from "@/components/logo-home-link";
import { XopcLogoMark } from "@/components/xopc-logo-mark";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_ISSUES, LANDING_GITHUB_LICENSE, LANDING_GITHUB_REPO } from "@/lib/landing-urls";
import { LANDING_MEDIA } from "@/lib/landing-media";
import { resolveLocaleMediaSrc } from "@/lib/locale-media.server";

const SHOW_TESTIMONIALS_SECTION = false;

const FEATURE_ICON_MAP: Record<string, LucideIcon> = {
  key: KeyRound,
  layers: Layers,
  "git-branch": GitBranch,
  bot: Bot,
  puzzle: Puzzle,
  "hard-drive": HardDrive,
  globe: Globe,
  wrench: Wrench,
  mic: Mic,
};

function FeatureIcon({ name }: { name: string }) {
  const Icon = FEATURE_ICON_MAP[name] ?? KeyRound;

  return (
    <div className="feature-icon">
      <Icon className="feature-icon-svg" strokeWidth={1.75} aria-hidden />
    </div>
  );
}

type Props = {
  locale: Locale;
  messages: Messages;
  docHome: string;
  docWorkflows: string;
};

function dotClass(dot: string): string {
  return `dot dot-${dot}`;
}

function avatarStyle(style: string | undefined): CSSProperties | undefined {
  if (style === "green") return { background: "linear-gradient(135deg,#34d399,#059669)" };
  if (style === "purple") return { background: "linear-gradient(135deg,#a78bfa,#7c3aed)" };
  return undefined;
}

function AutomationCodeBlock({ title }: { title: string }) {
  return (
    <div className="code-block">
      <div className="code-block-header">
        <div className="code-dot red" />
        <div className="code-dot yellow" />
        <div className="code-dot green" />
        <div className="code-block-title">{title}</div>
      </div>
      <div className="code-content">
        <span className="code-punct">{"{"}</span>
        {"\n  "}
        <span className="code-key">&quot;cron&quot;</span>
        <span className="code-punct">: {"{"}</span>
        {"\n    "}
        <span className="code-key">&quot;enabled&quot;</span>
        <span className="code-punct">:</span> <span className="code-num">true</span>
        <span className="code-punct">,</span>
        {"\n    "}
        <span className="code-key">&quot;jobs&quot;</span>
        <span className="code-punct">: [</span>
        {"\n      "}
        <span className="code-punct">{"{"}</span>
        {"\n        "}
        <span className="code-key">&quot;id&quot;</span>
        <span className="code-punct">:</span> <span className="code-string">&quot;daily-summary&quot;</span>
        <span className="code-punct">,</span>
        {"\n        "}
        <span className="code-key">&quot;schedule&quot;</span>
        <span className="code-punct">:</span> <span className="code-string">&quot;0 9 * * *&quot;</span>
        <span className="code-punct">,</span>
        {"\n        "}
        <span className="code-key">&quot;agent&quot;</span>
        <span className="code-punct">:</span> <span className="code-string">&quot;main&quot;</span>
        <span className="code-punct">,</span>
        {"\n        "}
        <span className="code-key">&quot;prompt&quot;</span>
        <span className="code-punct">:</span> <span className="code-string">&quot;Send me today&apos;s</span>
        <br />
        <span className="code-string">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;news summary&quot;</span>
        {"\n      "}
        <span className="code-punct">{"}"}</span>
        <span className="code-punct">,</span>
        {"\n      "}
        <span className="code-punct">{"{"}</span>
        {"\n        "}
        <span className="code-key">&quot;id&quot;</span>
        <span className="code-punct">:</span> <span className="code-string">&quot;weekly-review&quot;</span>
        <span className="code-punct">,</span>
        {"\n        "}
        <span className="code-key">&quot;schedule&quot;</span>
        <span className="code-punct">:</span> <span className="code-string">&quot;0 18 * * 5&quot;</span>
        <span className="code-punct">,</span>
        {"\n        "}
        <span className="code-key">&quot;agent&quot;</span>
        <span className="code-punct">:</span> <span className="code-string">&quot;work&quot;</span>
        {"\n      "}
        <span className="code-punct">{"}"}</span>
        {"\n    "}
        <span className="code-punct">]</span>
        {"\n  "}
        <span className="code-punct">{"}"}</span>
        {"\n"}
        <span className="code-punct">{"}"}</span>
      </div>
    </div>
  );
}

export function LandingPage({ locale, messages: m, docHome, docWorkflows }: Props) {
  const L = m.landing;
  const year = new Date().getFullYear();
  const providerChipsRow = [...L.providers.chips, ...L.providers.chips];
  const demoVideoSrc = resolveLocaleMediaSrc(LANDING_MEDIA.demo.full, locale);

  return (
    <div className="landing-page">
      <LandingScrollReveal />
      <nav>
        <div className="container nav-inner">
          <div className="nav-logo">
            <LogoHomeLink locale={locale} ariaLabel="xopc home" />
          </div>
          <ul className="nav-links">
            <li>
              <a href="#belief">{L.nav.belief}</a>
            </li>
            <li>
              <a href="#loop">{L.nav.loop}</a>
            </li>
            <li>
              <a href="#demo">{L.nav.demo}</a>
            </li>
            <li>
              <a href="#features">{L.nav.system}</a>
            </li>
            <li>
              <a href="#channels">{L.nav.channels}</a>
            </li>
            <li>
              <a href="#workflows">{L.nav.workflows}</a>
            </li>
            <li>
              <a href="#architecture">{L.nav.architecture}</a>
            </li>
            <li>
              <a href="#download">{L.nav.download}</a>
            </li>
          </ul>
          <div className="nav-extra">
            <div className="nav-extra-tools">
              <LocaleSwitcher
                locale={locale}
                labelZh={m.header.langZh}
                labelEn={m.header.langEn}
                chooseLanguageLabel={m.header.chooseLanguage}
                variant="landing"
              />
              <span className="nav-extra-divider" aria-hidden />
              <ThemeToggle
                variant="pill"
                ariaLight={m.header.themeLight}
                ariaDark={m.header.themeDark}
                ariaToggle={m.header.themeToggle}
              />
              <span className="nav-extra-divider" aria-hidden />
              <a
                href={LANDING_GITHUB_REPO}
                className="nav-github-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={L.nav.github}
              >
                <Github strokeWidth={1.75} aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-glow" aria-hidden />
        <div className="hero-grid" aria-hidden />
        <div className="container hero-inner">
          <HeroBrand
            brandName={L.hero.brandName}
            headlineLine1={L.hero.headlineLine1}
            headlineLine2={L.hero.headlineLine2}
          />

          <p className="hero-desc fade-up delay-2">{L.hero.desc}</p>

          <div className="hero-quick-start fade-up delay-3" id="download">
            <QuickInstallBlock d={L.download} />
          </div>


        </div>
      </section>

      <section className="belief-section landing-reveal" id="belief">
        <div className="container belief-layout">
          <div className="belief-kicker">{L.belief.kicker}</div>
          <div className="belief-copy">
            <h2>{L.belief.title}</h2>
            <p>{L.belief.body}</p>
          </div>
          <div className="belief-lines" aria-label={L.belief.linesLabel}>
            {L.belief.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="loop-section landing-reveal" id="loop">
        <div className="container">
          <div className="section-header">
            <h2>
              {L.loop.titleLine1}
              <br />
              {L.loop.titleLine2}
            </h2>
            <p>{L.loop.desc}</p>
          </div>
          <div className="loop-model" aria-label={L.loop.modelLabel}>
            {L.loop.steps.map((step, index) => (
              <div className="loop-step" key={step.title}>
                <div className="loop-step-index">0{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="demo-section landing-reveal" id="demo">
        <div className="container">
          <div className="section-header">
            <h2>
              {L.demo.titleLine1}
              <br />
              {L.demo.titleLine2}
            </h2>
            <p>{L.demo.desc}</p>
          </div>

          <div className="video-wrapper">
            <video
              className="demo-video"
              controls
              playsInline
              preload="metadata"
              aria-label={L.demo.videoAria}
            >
              <source src={demoVideoSrc} type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <section className="features-section landing-reveal" id="features">
        <div className="container">
          <div className="section-header">
            <h2>
              {L.features.titleLine1}
              <br />
              {L.features.titleLine2}
            </h2>
            <p>{L.features.desc}</p>
          </div>

          <div className="feature-groups">
            {L.features.groups.map((group, groupIndex) => (
              <section className="feature-group" key={group.title} aria-labelledby={`feature-group-${groupIndex}`}>
                <div className="feature-group-header">
                  <h3 id={`feature-group-${groupIndex}`}>{group.title}</h3>
                  <p>{group.desc}</p>
                </div>

                <div className="features-grid">
                  {group.items.map((itemIndex) => {
                    const item = L.features.items[itemIndex];

                    return (
                      <div
                        className={`feature-card${item.featured ? " featured" : ""}`}
                        key={item.title}
                      >
                        <FeatureIcon name={item.icon} />
                        <h3>{item.title}</h3>
                        <p>{item.body}</p>
                        {item.featured ? <span className="feature-tag">{L.features.tagFeatured}</span> : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <SurfaceGallery
        locale={locale}
        titleLine1={L.channels.titleLine1}
        titleLine2={L.channels.titleLine2}
        desc={L.channels.desc}
        items={L.channels.items}
        placeholderAction={L.channels.placeholderAction}
      />

      <section className="providers-section landing-reveal" id="providers">
        <div className="container">
          <div className="section-header">
            <h2>
              {L.providers.titleLine1}
              <br />
              {L.providers.titleLine2}
            </h2>
            <p>{L.providers.desc}</p>
          </div>
        </div>

        <div className="providers-marquee-wrapper">
          <div className="providers-marquee">
            {providerChipsRow.map((chip, i) => (
              <div className="provider-chip" key={`${chip.name}-${i}`}>
                <span className={dotClass(chip.dot)} />
                {chip.name}
              </div>
            ))}
          </div>
        </div>

        <div className="container">
          <div className="providers-cta">
            <a href={docHome} className="btn-secondary" target="_blank" rel="noopener noreferrer">
              {L.providers.viewProviders}
            </a>
          </div>
        </div>
      </section>

      <section className="automation-section landing-reveal" id="automation">
        <div className="container">
          <div className="automation-layout">
            <AutomationCodeBlock title={L.automation.codeTitle} />

            <div className="automation-content">
              <h2>
                {L.automation.titleLine1}
                <br />
                {L.automation.titleLine2}
              </h2>
              <p>{L.automation.desc}</p>

              <div className="feature-list">
                {L.automation.bullets.map((line) => (
                  <div className="feature-list-item" key={line}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="workflows-section landing-reveal" id="workflows">
        <div className="container">
          <div className="workflows-layout">
            <div className="workflows-content">
              <h2>
                {L.workflows.titleLine1}
                <br />
                {L.workflows.titleLine2}
              </h2>
              <p>{L.workflows.desc}</p>

              <div className="feature-list">
                {L.workflows.bullets.map((line) => (
                  <div className="feature-list-item" key={line}>
                    {line}
                  </div>
                ))}
              </div>

              <a
                href={docWorkflows}
                className="btn-secondary workflows-docs-cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="btn-ic" strokeWidth={1.75} aria-hidden />
                {L.workflows.viewDocs}
              </a>
            </div>

            <div className="workflows-visual">
              <WorkflowBoardPreview board={L.workflows.board} />
            </div>
          </div>
        </div>
      </section>

      <section className="arch-section landing-reveal" id="architecture">
        <div className="container">
          <div className="section-header">
            <h2>
              {L.architecture.titleLine1}
              <br />
              {L.architecture.titleLine2}
            </h2>
            <p>{L.architecture.desc}</p>
          </div>

          <ArchitectureDiagram
            slot={LANDING_MEDIA.architecture.diagram}
            locale={locale}
            alt={L.architecture.diagramAlt}
            expandLabel={L.architecture.expandLabel}
            closeLabel={L.architecture.closeLabel}
          />
        </div>
      </section>

      {SHOW_TESTIMONIALS_SECTION ? (
        <section className="testimonials-section">
          <div className="container">
            <div className="section-header">
              <h2>{L.testimonials.title}</h2>
              <p>{L.testimonials.desc}</p>
            </div>

            <div className="testimonials-grid">
              {L.testimonials.items.map((t, ti) => (
                <div className="testimonial-card" key={`t-${ti}`}>
                  <p className="testimonial-text">&ldquo;{t.quote}&rdquo;</p>
                  <div className="testimonial-author">
                    <div className="avatar" style={avatarStyle(t.avatarStyle)}>
                      {t.avatar}
                    </div>
                    <div className="author-info">
                      <div className="author-name">{t.author}</div>
                      <div className="author-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="cta-section landing-reveal">
        <div className="cta-glow" aria-hidden />
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <h2>
            {L.cta.titleLine1}
            <br />
            {L.cta.titleLine2}
          </h2>
          <p>{L.cta.desc}</p>

          <div className="cta-actions">
            <a href="#download" className="btn-primary">
              {L.cta.primary}
            </a>
            <a href={LANDING_GITHUB_REPO} className="btn-secondary" target="_blank" rel="noopener noreferrer">
              <Github className="btn-ic" strokeWidth={1.75} aria-hidden />
              {L.cta.secondary}
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="container footer-inner">
          <div className="footer-logo" aria-label="xopc">
            <XopcLogoMark />
          </div>
          <ul className="footer-links">
            <li>
              <a href={LANDING_GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                {L.footer.github}
              </a>
            </li>
            <li>
              <a href={docHome} target="_blank" rel="noopener noreferrer">
                {L.footer.docs}
              </a>
            </li>
            <li>
              <a href={LANDING_GITHUB_LICENSE} target="_blank" rel="noopener noreferrer">
                {L.footer.license}
              </a>
            </li>
            <li>
              <a href={LANDING_GITHUB_ISSUES} target="_blank" rel="noopener noreferrer">
                {L.footer.issues}
              </a>
            </li>
          </ul>
          <div className="footer-copy">{L.footer.copyright.replace("{year}", String(year))}</div>
        </div>
      </footer>
    </div>
  );
}
