import { ArrowDown, ArrowUpRight, Github, Terminal } from "lucide-react";
import { LandingFooter } from "@/components/landing-footer";
import { LandingAnalytics } from "@/components/landing-analytics";
import { LandingHeader } from "@/components/landing-header";
import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { LandingNavState } from "@/components/landing-nav-state";
import { PersonalAiSection } from "@/components/personal-ai-section";
import { ProductDesktopDownloads } from "@/components/product-desktop-downloads";
import { MobileDownloads } from "@/components/mobile-downloads";
import { TerminalInstallCommands } from "@/components/terminal-install-commands";
import { ExperienceChoices, WorkSection, ExperienceBridge } from "@/components/landing-experiences";
import { storyCopy } from "@/lib/landing-story-copy";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";
import styles from "./landing-story.module.css";

export function LandingPage({ locale, messages: m, docHome }: { locale: Locale; messages: Messages; docHome: string }) {
  const c = storyCopy[locale];
  const L = m.landing;
  const schema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "xopc", applicationCategory: "ProductivityApplication", operatingSystem: "macOS, Windows, Linux", description: m.meta.description, downloadUrl: `https://xopc.ai/${locale}#download`, featureList: L.productProof.capabilities.map(item => item.title), license: "https://opensource.org/license/mit", sameAs: [LANDING_GITHUB_REPO] };
  return <div className={`landing-page ${styles.page}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <LandingAnalytics /><LandingLocaleTransition /><LandingNavState />
    <LandingHeader locale={locale} header={m.header} nav={L.nav} docHome={docHome} />
    <section className={styles.hero} aria-labelledby="story-headline">
      <div className={styles.heroCopy}>
        <p className={styles.brandSlogan}>Keep what matters <span>moving.</span></p>
        <h1 id="story-headline">{c.headline[0]}<br /><span>{c.headline[1]}</span></h1>
        <p className={styles.heroDesc}>{c.description}</p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#download" data-product-event="hero_download_clicked">{c.download}<ArrowUpRight size={18} /></a>
          <a className={styles.textLink} href="#personal-ai">{c.begin}<ArrowDown size={16} /></a>
        </div>
      </div>
      <ExperienceChoices locale={locale} />
    </section>
    <PersonalAiSection locale={locale} />
    <WorkSection locale={locale} />
    <ExperienceBridge locale={locale} />
    <section className={styles.trust} id="trust">
      <h2>{c.trustTitle}</h2>
      <div className={styles.trustItems}>{c.trust.map((item, i) => <div key={item.title}><span>0{i + 1}</span><h3>{item.title}</h3><p>{item.body}</p></div>)}</div>
      <a className={styles.textLink} href={`/${locale}/privacy`}>{c.privacy}<ArrowUpRight size={15} /></a>
    </section>
    <div className={styles.downloads}>
      <ProductDesktopDownloads id="download" d={L.download} title={c.downloadTitle} desc={c.downloadDesc} />
      <div className={styles.otherWays}>
        <a className={styles.textLink} href="#mobile-download">{c.mobileDownload}<ArrowDown size={15} /></a>
        <a className={styles.textLink} href={LANDING_GITHUB_REPO} target="_blank" rel="noopener noreferrer"><Github size={16} />GitHub<ArrowUpRight size={15} /></a>
      </div>
      <details className={styles.terminal} id="terminal-install"><summary><Terminal size={16} />{L.download.terminalSectionTitle}</summary><TerminalInstallCommands commands={[{ label: L.download.terminalUnixLabel, value: L.download.terminalUnixCommand }, { label: L.download.terminalWindowsLabel, value: L.download.terminalWindowsCommand }]} copyLabel={L.download.terminalCopy} copiedLabel={L.download.terminalCopied} /></details>
    </div>
    <MobileDownloads d={L.download} locale={locale} />
    <LandingFooter footer={L.footer} docsHref={docHome} locale={locale} />
  </div>;
}
