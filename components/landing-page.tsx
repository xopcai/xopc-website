import Image from "next/image";
import { ArrowDown, ArrowUpRight, Github, Play, Terminal } from "lucide-react";
import { Loopi } from "@/components/brand/loopi";
import { LandingFooter } from "@/components/landing-footer";
import { LandingAnalytics } from "@/components/landing-analytics";
import { LandingHeader } from "@/components/landing-header";
import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { LandingNavState } from "@/components/landing-nav-state";
import { ProductIntroVideo } from "@/components/product-intro-video";
import { ProductDesktopDownloads } from "@/components/product-desktop-downloads";
import { MobileDownloads } from "@/components/mobile-downloads";
import { TerminalInstallCommands } from "@/components/terminal-install-commands";
import { LandingStory } from "@/components/landing-story";
import { ProductFilmButton } from "@/components/product-film-button";
import { launchFilm } from "@/lib/launch-film";
import { storyCopy } from "@/lib/landing-story-copy";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";
import styles from "./landing-story.module.css";

export function LandingPage({ locale, messages: m, docHome }: { locale: Locale; messages: Messages; docHome: string }) {
  const c = storyCopy[locale];
  const L = m.landing;
  const film = launchFilm(locale);
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
          <ProductFilmButton locale={locale} film={film} title={film.title} label={c.watch} className={styles.watchFilm} analyticsMethod="launch-hero" />
        </div>
      </div>
      <div className={styles.desk} aria-label={c.deskLabel}>
        <div className={`${styles.note} ${styles.noteOne}`}><span className={styles.noteLabel}>PROJECT / 01</span><strong>{c.notes[0]}</strong><div className={styles.paperLines}><i /><i /><i /></div><small>{c.stalled}</small></div>
        <div className={`${styles.note} ${styles.noteTwo}`}><span className={styles.noteLabel}>{c.notes[1]}</span><strong>{c.notes[2]}</strong><span className={styles.handLine} /></div>
        <div className={`${styles.note} ${styles.noteThree}`}><span className={styles.noteLabel}>{c.notes[3]}</span><div className={styles.checkline}><i />{c.notes[4]}</div><div className={styles.checkline}><i />{c.notes[5]}</div></div>
        <svg className={styles.thread} viewBox="0 0 900 300" fill="none" aria-hidden="true"><path d="M55 145 C180 5 250 285 390 165 S560 40 620 175 S770 260 845 90" /></svg>
        <div className={styles.heroLoopi}><Loopi interactive language={locale} mood="care" /></div>
        <div className={styles.hello}>{c.hello}<span /></div>
      </div>
    </section>
    <section className={styles.filmSection} id="film" aria-labelledby="launch-film-title">
      <div className={styles.filmHeading}><div><p className={styles.filmEyebrow}>{c.filmEyebrow}</p><h2 id="launch-film-title">{c.filmTitle}</h2></div><p>{c.filmDesc}</p></div>
      <div className={styles.film}><ProductIntroVideo locale={locale} overview /></div>
      <div className={styles.filmChapters} aria-label={c.filmChaptersLabel}>
        {film.chapters.map((chapter, index) => <ProductFilmButton key={chapter.start} locale={locale} film={film} title={film.title} label={`${chapter.title} · 0:${chapter.start.toString().padStart(2, "0")}`} start={chapter.start} className={styles.filmChapter} analyticsMethod={`launch-chapter-${index + 1}`}>
          <div className={styles.chapterPreview}><Image src={chapter.thumbnail} alt="" width={480} height={270} sizes="(max-width: 600px) 44vw, 240px" /><span><Play size={16} aria-hidden="true" /></span></div>
          <span className={styles.chapterCaption}><span>0:{chapter.start.toString().padStart(2, "0")}</span><strong>{chapter.title}</strong></span>
        </ProductFilmButton>)}
      </div>
      <p className={styles.filmNote}>{c.filmNote}</p>
      <a className={styles.textLink} href={`/${locale}/learn`}><Play size={14} />{c.moreFilms}<ArrowUpRight size={14} /></a>
    </section>
    <LandingStory locale={locale} />
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
      <details className={styles.terminal} id="terminal-install"><summary><Terminal size={16} />{L.download.terminalSectionTitle}</summary><TerminalInstallCommands commands={[{ label: L.download.terminalUnixLabel, value: L.download.terminalUnixCommand, method: "unix" }, { label: L.download.terminalWindowsLabel, value: L.download.terminalWindowsCommand, method: "windows" }]} copyLabel={L.download.terminalCopy} copiedLabel={L.download.terminalCopied} /></details>
    </div>
    <MobileDownloads d={L.download} locale={locale} />
    <LandingFooter footer={L.footer} docsHref={docHome} locale={locale} />
  </div>;
}
