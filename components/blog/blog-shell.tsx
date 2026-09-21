import type { ReactNode } from "react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import { LandingNavState } from "@/components/landing-nav-state";
import { docBaseUrl, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function BlogShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const messages = getMessages(locale);
  return <div className="landing-page blog-page">
    <LandingNavState />
    <LandingHeader locale={locale} header={messages.header} nav={messages.landing.nav} docHome={docBaseUrl(locale)} activePage="blog" reserveSpace />
    <main id="blog-main">{children}</main>
    <LandingFooter locale={locale} footer={messages.landing.footer} docsHref={docBaseUrl(locale)} />
  </div>;
}
