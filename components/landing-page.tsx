import {
  ArrowRight,
  BookOpen,
  Bot,
  GitBranch,
  Github,
  HardDrive,
  KeyRound,
  Layers,
  Puzzle,
  Smartphone,
  Target,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { HeroBrand } from "@/components/hero-brand";
import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { LandingFooter } from "@/components/landing-footer";
import { LandingNavState } from "@/components/landing-nav-state";
import { LandingScrollReveal } from "@/components/landing-scroll-reveal";
import { QuickInstallBlock } from "@/components/quick-install-block";
import { SurfaceGallery } from "@/components/surface-gallery";
import { WorkflowBoardPreview } from "@/components/workflow-board-preview";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoHomeLink } from "@/components/logo-home-link";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO, LANDING_MOBILE_APP_REPO } from "@/lib/landing-urls";
import { LANDING_MEDIA, type SurfaceMediaId } from "@/lib/landing-media";
import { resolveLocaleMediaSrc } from "@/lib/locale-media.server";

const FEATURE_ICON_MAP: Record<string, LucideIcon> = {
  key: KeyRound,
  layers: Layers,
  "git-branch": GitBranch,
  bot: Bot,
  puzzle: Puzzle,
  "hard-drive": HardDrive,
  target: Target,
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

export function LandingPage({ locale, messages: m, docHome, docWorkflows }: Props) {
  const L = m.landing;
  const surfaceMediaSrcs = Object.fromEntries(
    Object.entries(LANDING_MEDIA.surfaces).map(([id, media]) => [id, resolveLocaleMediaSrc(media, locale)]),
  ) as Partial<Record<SurfaceMediaId, string>>;

  return (
    <div className="landing-page">
      <LandingLocaleTransition />
      <LandingNavState />
      <LandingScrollReveal />
      <nav>
        <div className="container nav-inner">
          <div className="nav-logo">
            <LogoHomeLink locale={locale} ariaLabel="xopc home" />
          </div>
          <ul className="nav-links">
            <li>
              <Link href={`/${locale}/products/worker`}>{L.products.nav.operator}</Link>
            </li>
            <li>
              <Link href={`/${locale}/products/code`}>{L.products.nav.code}</Link>
            </li>
            <li>
              <Link href={`/${locale}/products/gateway`}>{L.products.nav.gateway}</Link>
            </li>
            <li>
              <a href="#loop">{L.nav.loop}</a>
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
              <ThemeToggle
                variant="pill"
                ariaLight={m.header.themeLight}
                ariaDark={m.header.themeDark}
                ariaToggle={m.header.themeToggle}
              />
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

      <section className="product-chooser-section landing-reveal" aria-labelledby="products-title">
        <div className="container">
          <div className="product-chooser-header">
            <p className="product-chooser-kicker">{L.products.home.kicker}</p>
            <h2 id="products-title">
              {L.products.home.titleLine1}
              <br />
              {L.products.home.titleLine2}
            </h2>
            <p>{L.products.home.desc}</p>
          </div>
          <div className="product-choice-grid">
            {([
              ["operator", "worker"],
              ["code", "code"],
              ["gateway", "gateway"],
            ] as const).map(([product, slug]) => {
              const item = L.products.home[product];
              return (
                <Link href={`/${locale}/products/${slug}`} className="product-choice-card" key={product}>
                  <span className="product-choice-label">{item.label}</span>
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                  <span className="product-choice-link">
                    {item.cta}
                    <ArrowRight aria-hidden />
                  </span>
                </Link>
              );
            })}
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
        mediaSrcs={surfaceMediaSrcs}
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
            {L.providers.chips.map((chip) => (
              <div className="provider-chip" key={chip.name}>
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

      <div className="landing-cta-footer">
        <section className="cta-section landing-reveal">
          <div className="container">
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
              <a href={LANDING_MOBILE_APP_REPO} className="btn-secondary" target="_blank" rel="noopener noreferrer">
                <Smartphone className="btn-ic" strokeWidth={1.75} aria-hidden />
                {L.cta.mobileApp}
              </a>
            </div>
          </div>
        </section>

        <LandingFooter footer={L.footer} docsHref={docHome} />
      </div>
    </div>
  );
}
