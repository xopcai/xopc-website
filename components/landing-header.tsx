import { Github } from "lucide-react";
import Link from "next/link";

import { AnimatedRouteLink } from "@/components/animated-route-link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoHomeLink } from "@/components/logo-home-link";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";

type Props = {
  locale: Locale;
  header: Messages["header"];
  nav: Messages["landing"]["nav"];
  docHome: string;
  activePage?: "use-cases" | "product-map" | "learn";
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
            <MobileNavMenu locale={locale} />
            <div className="nav-logo">
              <LogoHomeLink
                locale={locale}
                ariaLabel="xopc home"
              />
            </div>
          </div>
          <ul className="nav-links">
            <li><Link href={activePage ? `${home}#why` : "#why"}>{nav.why}</Link></li>
            <li><Link href={activePage ? `${home}#loop` : "#loop"}>{nav.how}</Link></li>
            <li><Link href={activePage ? `${home}#trust` : "#trust"}>{nav.trust}</Link></li>
            <li>
              <AnimatedRouteLink
                href={`${home}/use-cases`}
                className={activePage === "use-cases" ? "is-active" : undefined}
                aria-current={activePage === "use-cases" ? "page" : undefined}
              >
                {nav.useCases}
              </AnimatedRouteLink>
            </li>
            <li>
              <AnimatedRouteLink
                href={`${home}/product-map`}
                className={activePage === "product-map" ? "is-active" : undefined}
                aria-current={activePage === "product-map" ? "page" : undefined}
              >
                {nav.productMap}
              </AnimatedRouteLink>
            </li>
            <li><a href={docHome} target="_blank" rel="noopener noreferrer">{nav.docs}</a></li>
          </ul>
          <div className="nav-extra">
            <AnimatedRouteLink href={`${home}/product-map`} className="nav-map-mobile">{nav.productMap}</AnimatedRouteLink>
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
