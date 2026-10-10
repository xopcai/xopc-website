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
  activePage?: "use-cases" | "product-map" | "learn" | "blog" | "ada";
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
            <li><AnimatedRouteLink href={`${home}/ada`} className={activePage === "ada" ? "is-active" : undefined} aria-current={activePage === "ada" ? "page" : undefined}>Ada</AnimatedRouteLink></li>
            <li>
              <AnimatedRouteLink
                href={`${home}/use-cases`}
                className={activePage === "use-cases" ? "is-active" : undefined}
                aria-current={activePage === "use-cases" ? "page" : undefined}
              >
                {nav.useCases}
              </AnimatedRouteLink>
            </li>
            <li><AnimatedRouteLink href={`${home}/learn`} className={activePage === "learn" || activePage === "product-map" ? "is-active" : undefined} aria-current={activePage === "learn" ? "page" : undefined}>{locale === "zh" ? "探索与学习" : "Explore & learn"}</AnimatedRouteLink></li>
            <li><AnimatedRouteLink href={`${home}/blog`} className={activePage === "blog" ? "is-active" : undefined} aria-current={activePage === "blog" ? "page" : undefined}>{locale === "zh" ? "博客" : "Blog"}</AnimatedRouteLink></li>
            <li><a href={docHome} target="_blank" rel="noopener noreferrer">{nav.docs}</a></li>
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
