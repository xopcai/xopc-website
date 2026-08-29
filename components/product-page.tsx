import { ArrowRight, ArrowRightLeft, Code2, Github, HardDrive, Monitor, ShieldCheck, Terminal } from "lucide-react";
import Link from "next/link";

import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { LandingFooter } from "@/components/landing-footer";
import { LandingNavState } from "@/components/landing-nav-state";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoHomeLink } from "@/components/logo-home-link";
import { ProductDesktopDownloads } from "@/components/product-desktop-downloads";
import { ProductQuickStart } from "@/components/product-quick-start";
import { ThemeToggle } from "@/components/theme-toggle";
import { docBaseUrl, type Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";

export const productSlugs = ["desktop", "terminal", "gateway"] as const;
export type ProductSlug = (typeof productSlugs)[number];

export function isProductSlug(value: string): value is ProductSlug {
  return (productSlugs as readonly string[]).includes(value);
}

type Props = {
  locale: Locale;
  messages: Messages;
  productSlug: ProductSlug;
};

export function ProductPage({ locale, messages: m, productSlug }: Props) {
  const P = m.landing.products[productSlug];
  const otherSlug: ProductSlug = productSlug === "desktop" ? "terminal" : "desktop";
  const other = m.landing.products[otherSlug];
  const homeHref = `/${locale}`;
  const docsHref = docBaseUrl(locale);

  return (
    <div className="landing-page product-page">
      <LandingLocaleTransition />
      <LandingNavState />
      <nav>
        <div className="container nav-inner">
          <div className="nav-logo">
            <LogoHomeLink locale={locale} ariaLabel="xopc home" />
          </div>
          <ul className="nav-links">
            <li>
              <Link href={homeHref}>{m.landing.products.nav.home}</Link>
            </li>
            <li>
              <Link href={`/${locale}/products/desktop`} className={productSlug === "desktop" ? "is-active" : undefined}>
                {m.landing.products.nav.desktop}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/products/terminal`} className={productSlug === "terminal" ? "is-active" : undefined}>
                {m.landing.products.nav.terminal}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/products/gateway`} className={productSlug === "gateway" ? "is-active" : undefined}>
                {m.landing.products.nav.gateway}
              </Link>
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
              <a href={LANDING_GITHUB_REPO} className="nav-github-link" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github strokeWidth={1.75} aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="product-hero">
        <div className="container product-hero-grid">
          <div className="product-hero-copy">
            <p className="product-kicker">{P.kicker}</p>
            <h1>
              {P.titleLine1}
              <span>{P.titleLine2}</span>
            </h1>
            <p>{P.desc}</p>
            <div className="product-hero-actions">
              <a href="#get-started" className="product-button product-button--secondary">
                {P.secondaryCta}
                <ArrowRight aria-hidden />
              </a>
            </div>
            {productSlug === "desktop" ? (
              <ul className="product-hero-points">
                <li>
                  <Monitor aria-hidden />
                  {m.landing.products.desktop.desktopPoints[0]}
                </li>
                <li>
                  <HardDrive aria-hidden />
                  {m.landing.products.desktop.desktopPoints[1]}
                </li>
                <li>
                  <ShieldCheck aria-hidden />
                  {m.landing.products.desktop.desktopPoints[2]}
                </li>
              </ul>
            ) : null}
            {productSlug === "terminal" ? (
              <ul className="product-hero-points">
                <li>
                  <Terminal aria-hidden />
                  {m.landing.products.terminal.terminalPoints[0]}
                </li>
                <li>
                  <Code2 aria-hidden />
                  {m.landing.products.terminal.terminalPoints[1]}
                </li>
                <li>
                  <ArrowRightLeft aria-hidden />
                  {m.landing.products.terminal.terminalPoints[2]}
                </li>
              </ul>
            ) : null}
          </div>
          <div className="product-demo" id="demo">
            <span className="product-demo-kicker">{P.flow.kicker}</span>
            <ol className="product-demo-steps">
              {P.flow.steps.map((step, index) => (
                <li key={step.title}>
                  <span>0{index + 1}</span>
                  <strong>{step.title}</strong>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {productSlug === "desktop" ? (
        <ProductDesktopDownloads d={m.landing.download} {...m.landing.products.desktop.desktopDownload} />
      ) : productSlug === "terminal" ? (
        <ProductQuickStart {...m.landing.products.terminal.quickStart} />
      ) : (
        <ProductQuickStart {...m.landing.products.gateway.quickStart} />
      )}

      <section className="product-section product-section--muted">
        <div className="container">
          <div className="product-section-header">
            <p className="product-kicker">{P.flow.kicker}</p>
            <h2>{P.flow.title}</h2>
            <p>{P.flow.desc}</p>
          </div>
          <div className="product-flow">
            {P.flow.steps.map((step, index) => (
              <article className="product-flow-step" key={step.title}>
                <span className="product-step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="product-section">
        <div className="container">
          <div className="product-section-header">
            <p className="product-kicker">{P.capabilities.kicker}</p>
            <h2>{P.capabilities.title}</h2>
            <p>{P.capabilities.desc}</p>
          </div>
          <div className="product-capabilities">
            {P.capabilities.items.map((item) => (
              <article className="product-capability" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="product-section product-section--muted">
        <div className="container">
          <div className="product-section-header">
            <p className="product-kicker">{P.scenarios.kicker}</p>
            <h2>{P.scenarios.title}</h2>
          </div>
          <div className="product-scenarios">
            {P.scenarios.items.map((item) => (
              <article className="product-scenario" key={item.title}>
                <span className="product-scenario-eyebrow">{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="product-section">
        <div className="container">
          <div className="product-section-header">
            <p className="product-kicker">{P.trust.kicker}</p>
            <h2>{P.trust.title}</h2>
          </div>
          <div className="product-trust-grid">
            {P.trust.items.map((item) => (
              <p key={item}>
                <ShieldCheck aria-hidden /> {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="product-section">
        <div className="container">
          <div className="product-cross">
            <p className="product-kicker">{P.cross.kicker}</p>
            <h2>{P.cross.title}</h2>
            <p>{P.cross.desc}</p>
            <Link href={`/${locale}/products/${otherSlug}`} className="product-cross-link">
              {P.cross.cta.replace("{product}", other.name)}
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter footer={m.landing.footer} docsHref={docsHref} />
    </div>
  );
}
