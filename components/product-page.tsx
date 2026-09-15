import {
  ArrowRight,
  ArrowRightLeft,
  Code2,
  HardDrive,
  Monitor,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import Link from "next/link";

import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { LandingFooter } from "@/components/landing-footer";
import { ProductDesktopDownloads } from "@/components/product-desktop-downloads";
import { ProductQuickStart } from "@/components/product-quick-start";
import { docBaseUrl, type Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { SiteHeader } from "@/components/site-header";

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
  const otherSlug: ProductSlug =
    productSlug === "desktop" ? "terminal" : "desktop";
  const other = m.landing.products[otherSlug];
  const docsHref = docBaseUrl(locale);

  return (
    <div className="landing-page site-page product-page">
      <LandingLocaleTransition />
      <SiteHeader locale={locale} />
      <div className="site-product-subnav">
        {productSlugs.map((slug) => (
          <Link
            key={slug}
            href={`/${locale}/products/${slug}`}
            aria-current={productSlug === slug ? "page" : undefined}
          >
            {m.landing.products.nav[slug]}
          </Link>
        ))}
      </div>

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
              <a
                href="#get-started"
                className="product-button product-button--secondary"
              >
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
        <ProductDesktopDownloads
          d={m.landing.download}
          {...m.landing.products.desktop.desktopDownload}
        />
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
            <Link
              href={`/${locale}/products/${otherSlug}`}
              className="product-cross-link"
            >
              {P.cross.cta.replace("{product}", other.name)}
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter
        footer={m.landing.footer}
        docsHref={docsHref}
        locale={locale}
      />
    </div>
  );
}
