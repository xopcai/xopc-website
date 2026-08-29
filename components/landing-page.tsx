import {
  Download,
  Github,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import Image from "next/image";

import { HeroBrand } from "@/components/hero-brand";
import { LandingFooter } from "@/components/landing-footer";
import { LandingAnalytics } from "@/components/landing-analytics";
import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { LandingNavState } from "@/components/landing-nav-state";
import { LandingScrollReveal } from "@/components/landing-scroll-reveal";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoHomeLink } from "@/components/logo-home-link";
import { MobileDownloads } from "@/components/mobile-downloads";
import { ProductDesktopDownloads } from "@/components/product-desktop-downloads";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";

type Props = {
  locale: Locale;
  messages: Messages;
  docHome: string;
};

export function LandingPage({ locale, messages: m, docHome }: Props) {
  const L = m.landing;
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "xopc",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "macOS, Windows, Linux",
    description: m.meta.description,
    downloadUrl: `https://xopc.ai/${locale}#download`,
    featureList: L.productProof.capabilities.map((item) => item.title),
    license: "https://opensource.org/license/mit",
    sameAs: [LANDING_GITHUB_REPO],
  };

  return (
    <div className="landing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema).replace(/</g, "\\u003c") }}
      />
      <LandingAnalytics />
      <LandingLocaleTransition />
      <LandingNavState />
      <LandingScrollReveal />

      <nav>
        <div className="container nav-inner">
          <div className="nav-logo">
            <LogoHomeLink locale={locale} ariaLabel="xopc home" />
          </div>
          <ul className="nav-links">
            <li><a href="#why">{L.nav.why}</a></li>
            <li><a href="#loop">{L.nav.how}</a></li>
            <li><a href="#trust">{L.nav.trust}</a></li>
            <li><a href={docHome} target="_blank" rel="noopener noreferrer">{L.nav.docs}</a></li>
          </ul>
          <div className="nav-extra">
            <a href="#download" className="nav-download-cta" data-product-event="nav_download_clicked">{L.nav.download}</a>
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
            headline={L.hero.headline}
          />
          <p className="hero-desc fade-up delay-2">{L.hero.desc}</p>
          <div className="hero-actions fade-up delay-3">
            <a href="#download" className="btn-primary" data-product-event="hero_download_clicked">
              <Download className="btn-ic" strokeWidth={1.75} aria-hidden />
              {L.hero.primaryCta}
            </a>
            <a href="#terminal-install" className="btn-secondary" data-product-event="terminal_install_clicked">
              <Terminal className="btn-ic" strokeWidth={1.75} aria-hidden />
              {L.hero.secondaryCta}
            </a>
          </div>
        </div>
      </section>

      <section className="aha-section landing-reveal" id="why">
        <div className="container aha-layout">
          <div className="aha-copy">
            <p className="section-kicker">{L.aha.kicker}</p>
            <h2>{L.aha.title}</h2>
            <p>{L.aha.desc}</p>
          </div>
          <div className="aha-conversation" aria-label={L.aha.ariaLabel}>
            <div className="aha-user-message">
              <span>{L.aha.userLabel}</span>
              <p>{L.aha.userMessage}</p>
            </div>
            <div className="aha-context">
              <span>{L.aha.contextLabel}</span>
              <ul>
                {L.aha.contextItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="aha-assistant-message">
              <span>{L.aha.assistantLabel}</span>
              <p>{L.aha.assistantMessage}</p>
              <div>
                <strong>{L.aha.nextStepLabel}</strong>
                {L.aha.nextStep}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="product-proof-section landing-reveal" aria-labelledby="product-proof-title">
        <div className="container">
          <div className="section-header product-proof-header">
            <p className="section-kicker">{L.productProof.kicker}</p>
            <h2 id="product-proof-title">{L.productProof.title}</h2>
            <p>{L.productProof.desc}</p>
          </div>
          <figure className="product-proof-frame">
            <Image
              src="/media/product/xopc-desktop.gif"
              width={1832}
              height={1132}
              sizes="(max-width: 760px) calc(100vw - 40px), 1120px"
              unoptimized
              alt={L.productProof.imageAlt}
            />
          </figure>
        </div>
      </section>

      <section className="loop-section landing-reveal" id="loop">
        <div className="container">
          <div className="section-header">
            <h2>{L.loop.titleLine1}<br />{L.loop.titleLine2}</h2>
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

      <section className="trust-section landing-reveal" id="trust">
        <div className="container">
          <div className="section-header">
            <h2>{L.trust.title}</h2>
            <p>{L.trust.desc}</p>
          </div>
          <div className="trust-layout">
            <div className="trust-grid">
              {L.trust.items.map((item) => (
                <article className="trust-card" key={item.title}>
                  <ShieldCheck aria-hidden strokeWidth={1.75} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="understanding-card">
              <div>
                <span>{L.trust.factLabel}</span>
                <p>{L.trust.factExample}</p>
              </div>
              <div>
                <span>{L.trust.inferenceLabel}</span>
                <p>{L.trust.inferenceExample}</p>
              </div>
              <p className="understanding-note">{L.trust.correctionNote}</p>
            </div>
          </div>
        </div>
      </section>

      <ProductDesktopDownloads
        id="download"
        d={L.download}
        kicker={L.download.desktopSectionKicker}
        title={L.download.desktopSectionTitle}
        desc={L.download.desktopSectionDesc}
      />

      <section className="terminal-install-section landing-reveal" id="terminal-install">
        <div className="container terminal-install-inner">
          <div className="terminal-install-copy">
            <p className="section-kicker">{L.download.terminalSectionKicker}</p>
            <h2>{L.download.terminalSectionTitle}</h2>
            <p>{L.download.terminalSectionDesc}</p>
          </div>
          <div className="terminal-install-commands">
            <div>
              <span>{L.download.terminalUnixLabel}</span>
              <code>{L.download.terminalUnixCommand}</code>
            </div>
            <div>
              <span>{L.download.terminalWindowsLabel}</span>
              <code>{L.download.terminalWindowsCommand}</code>
            </div>
          </div>
        </div>
      </section>

      <MobileDownloads d={L.download} />

      <div className="landing-cta-footer">
        <section className="cta-section landing-reveal">
          <div className="container">
            <h2>{L.cta.titleLine1}<br />{L.cta.titleLine2}</h2>
            <div className="cta-actions">
              <a href="#download" className="btn-primary" data-product-event="final_download_clicked">{L.cta.primary}</a>
              <a href={LANDING_GITHUB_REPO} className="btn-secondary" target="_blank" rel="noopener noreferrer">
                <Github className="btn-ic" strokeWidth={1.75} aria-hidden />
                {L.cta.secondary}
              </a>
            </div>
          </div>
        </section>
        <LandingFooter footer={L.footer} docsHref={docHome} />
      </div>
    </div>
  );
}
