import { Github } from "lucide-react";
import Link from "next/link";

import { AnimatedRouteLink } from "@/components/animated-route-link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoHomeLink } from "@/components/logo-home-link";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { NavDropdown } from "@/components/nav-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";

type Props = {
  locale: Locale;
  header: Messages["header"];
  nav: Messages["landing"]["nav"];
  docHome: string;
  activePage?: "use-cases" | "product-map" | "learn" | "blog";
  locationSuffix?: string;
  reserveSpace?: boolean;
};

export function LandingHeader({
  locale,
  header,
  nav,
  docHome,
  activePage,
  locationSuffix = "",
  reserveSpace = false,
}: Props) {
  const home = `/${locale}`;

  return (
    <>
      <nav
        aria-label={locale === "zh" ? "主导航" : "Main navigation"}
      >
        <div className="container nav-inner">
          <div className="nav-leading">
            <MobileNavMenu locale={locale} header={header} />
            <div className="nav-logo">
              <LogoHomeLink
                locale={locale}
                ariaLabel="xopc home"
              />
            </div>
          </div>
          <ul className="nav-links">
            <li><NavDropdown label={locale === "zh" ? "产品" : "Product"} active={activePage === "product-map"}>
              <Link href={`${home}#why`}>{nav.why}</Link>
              <Link href={`${home}#loop`}>{nav.how}</Link>
              <Link href={`${home}#trust`}>{nav.trust}</Link>
              <AnimatedRouteLink href={`${home}/product-map`} aria-current={activePage === "product-map" ? "page" : undefined}>{nav.productMap}</AnimatedRouteLink>
            </NavDropdown></li>
            <li>
              <AnimatedRouteLink
                href={`${home}/use-cases`}
                className={activePage === "use-cases" ? "is-active" : undefined}
                aria-current={activePage === "use-cases" ? "page" : undefined}
              >
                {nav.useCases}
              </AnimatedRouteLink>
            </li>
            <li><NavDropdown label={locale === "zh" ? "资源" : "Resources"} active={activePage === "blog" || activePage === "learn"}>
              <AnimatedRouteLink href={`${home}/blog`} aria-current={activePage === "blog" ? "page" : undefined}>{locale === "zh" ? "博客" : "Blog"}</AnimatedRouteLink>
              <AnimatedRouteLink href={`${home}/learn`} aria-current={activePage === "learn" ? "page" : undefined}>{locale === "zh" ? "教程" : "Learn"}</AnimatedRouteLink>
              <a href={docHome} target="_blank" rel="noopener noreferrer">{nav.docs}</a>
            </NavDropdown></li>
          </ul>
          <div className="nav-extra">
            <Link
              href={activePage ? `${home}#download` : "#download"}
              className="nav-download-cta"
              data-product-event="nav_download_clicked"
            >
              {nav.download}
            </Link>
            <div className="nav-extra-tools">
              <LocaleSwitcher
                locale={locale}
                labelZh={header.langZh}
                labelEn={header.langEn}
                chooseLanguageLabel={header.chooseLanguage}
                variant="landing"
                locationSuffix={locationSuffix}
              />
              <ThemeToggle
                variant="pill"
                ariaLight={header.themeLight}
                ariaDark={header.themeDark}
                ariaToggle={header.themeToggle}
              />
              <a
                href={LANDING_GITHUB_REPO}
                className="nav-github-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={nav.github}
              >
                <Github strokeWidth={1.75} aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </nav>
      {reserveSpace ? <div className="site-header-spacer" aria-hidden /> : null}
    </>
  );
}
