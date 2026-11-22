import Image from "next/image";
import Link from "next/link";
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
import { ProductFilmButton } from "@/components/product-film-button";
import { adaFilm } from "@/lib/ada";
import { launchFilm } from "@/lib/launch-film";
import { storyCopy } from "@/lib/landing-story-copy";
import { workFilm } from "@/lib/work-film";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";
import styles from "./landing-story.module.css";

export function LandingPage({ locale, messages: m, docHome }: { locale: Locale; messages: Messages; docHome: string }) {
  const c = storyCopy[locale];
  const L = m.landing;
  const film = launchFilm(locale);
  const work = workFilm(locale);
  const ada = adaFilm(locale);
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "xopc",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "macOS, Windows, Linux, iOS, Android, HarmonyOS",
    description: m.meta.description,
    downloadUrl: `https://xopc.ai/${locale}#download`,
    featureList: L.productProof.capabilities.map((item) => item.title),
    license: "https://opensource.org/license/mit",
    sameAs: [LANDING_GITHUB_REPO],
  };

  return (
    <div className={`landing-page ${styles.page}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <LandingAnalytics />
      <LandingLocaleTransition />
      <LandingNavState />
      <LandingHeader locale={locale} header={m.header} nav={L.nav} docHome={docHome} />

      <section className={styles.hero} aria-labelledby="story-headline">
        <div className={styles.heroInner}>
          <div className={styles.heroVisual}>
            <div className={styles.heroAura} aria-hidden="true" />
            <div className={styles.heroLoopi}>
              <Loopi interactive language={locale} mood="care" />
            </div>
          </div>

          <div className={styles.heroCopy}>
            <p className={styles.brandSlogan}>{c.eyebrow}</p>
            <h1 id="story-headline">
              <span className={styles.headlineLead}>{c.headline[0]}</span>
              <wbr />
              <span>{c.headline[1]}</span>
            </h1>
            <p className={styles.heroDesc}>{c.description}</p>
            <div className={styles.actions}>
              <a className={styles.primary} href="#download" data-product-event="hero_download_clicked">
                {c.download}
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <ProductFilmButton
                locale={locale}
                film={film}
                title={film.title}
                label={c.watch}
                className={styles.watchFilm}
                analyticsMethod="launch-hero"
              />
            </div>
            <p className={styles.heroSupport}>{c.supporting}</p>
          </div>

          <a className={styles.scrollCue} href="#film">
            <span>{c.scrollHint}</span>
            <ArrowDown size={15} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className={styles.filmSection} id="film" aria-labelledby="launch-film-title">
        <div className={styles.filmHeading}>
          <div>
            <p className={styles.filmEyebrow}>{c.filmEyebrow}</p>
            <h2 id="launch-film-title">{c.filmTitle}</h2>
          </div>
          <p>{c.filmDesc}</p>
        </div>
        <div className={styles.film}>
          <ProductIntroVideo locale={locale} overview />
        </div>
        <div className={styles.filmChapters} aria-label={c.filmChaptersLabel}>
          {film.chapters.map((chapter, index) => (
            <ProductFilmButton
              key={chapter.start}
              locale={locale}
              film={film}
              title={film.title}
              label={`${chapter.title} · 0:${chapter.start.toString().padStart(2, "0")}`}
              start={chapter.start}
              className={styles.filmChapter}
              analyticsMethod={`launch-chapter-${index + 1}`}
            >
              <div className={styles.chapterPreview}>
                <Image
                  src={chapter.thumbnail}
                  alt=""
                  width={480}
                  height={270}
                  sizes="(max-width: 600px) 44vw, 240px"
                />
                <span>
                  <Play size={15} aria-hidden="true" />
                </span>
              </div>
              <span className={styles.chapterCaption}>
                <span>0:{chapter.start.toString().padStart(2, "0")}</span>
                <strong>{chapter.title}</strong>
              </span>
            </ProductFilmButton>
          ))}
        </div>
        <p className={styles.filmNote}>{c.filmNote}</p>
      </section>

      <section className={styles.pillars} id="loop" aria-labelledby="pillars-title">
        <div className={styles.sectionHead}>
          <p className={styles.filmEyebrow}>{c.pillarsEyebrow}</p>
          <h2 id="pillars-title">{c.pillarsTitle}</h2>
        </div>
        <div className={styles.pillarGrid}>
          {c.pillars.map((item) => (
            <article key={item.num} className={styles.pillarCard}>
              <span className={styles.pillarNum}>{item.num}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <Link className={styles.textLink} href={`/${locale}/${item.href}`}>
                {item.linkLabel}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.demos} id="demos" aria-labelledby="demos-title">
        <div className={styles.demosHead}>
          <div>
            <p className={styles.filmEyebrow}>{c.demosEyebrow}</p>
            <h2 id="demos-title">{c.demosTitle}</h2>
          </div>
          <p>{c.demosDesc}</p>
        </div>

        <div className={styles.demoGrid}>
          <article className={styles.demoCard}>
            <ProductFilmButton
              locale={locale}
              film={work}
              title={work.title}
              label={`${c.workDemo.watch} · ${work.duration}`}
              className={styles.demoPosterBtn}
              analyticsMethod="work-overview"
            >
              <Image
                src={work.poster}
                alt={c.workDemo.title}
                width={1280}
                height={720}
                sizes="(max-width: 849px) 92vw, 540px"
              />
              <span className={styles.demoPlayBadge}>
                <Play size={16} fill="currentColor" aria-hidden="true" />
                <span>{work.duration}</span>
              </span>
            </ProductFilmButton>
            <div className={styles.demoBody}>
              <span className={styles.demoTag}>{c.workDemo.tag}</span>
              <h3>{c.workDemo.title}</h3>
              <p>{c.workDemo.desc}</p>
              <div className={styles.demoLinks}>
                <ProductFilmButton
                  locale={locale}
                  film={work}
                  title={work.title}
                  label={c.workDemo.watch}
                  className={styles.demoWatchInline}
                  analyticsMethod="work-card"
                />
                <Link className={styles.textLink} href={`/${locale}/use-cases`}>
                  {c.useCasesLink}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>

          <article className={styles.demoCard}>
            <ProductFilmButton
              locale={locale}
              film={ada}
              title={c.adaDemo.title}
              label={`${c.adaDemo.watch} · ${ada.duration}`}
              className={styles.demoPosterBtn}
              analyticsMethod="ada-home"
            >
              <Image
                src={ada.poster}
                alt={c.adaDemo.title}
                width={1280}
                height={720}
                sizes="(max-width: 849px) 92vw, 540px"
              />
              <span className={styles.demoPlayBadge}>
                <Play size={16} fill="currentColor" aria-hidden="true" />
                <span>{ada.duration}</span>
              </span>
            </ProductFilmButton>
            <div className={styles.demoBody}>
              <span className={styles.demoTag}>{c.adaDemo.tag}</span>
              <h3>{c.adaDemo.title}</h3>
              <p>{c.adaDemo.desc}</p>
              <div className={styles.demoLinks}>
                <ProductFilmButton
                  locale={locale}
                  film={ada}
                  title={c.adaDemo.title}
                  label={c.adaDemo.watch}
                  className={styles.demoWatchInline}
                  analyticsMethod="ada-card"
                />
                <Link className={styles.textLink} href={`/${locale}/ada`}>
                  {c.adaDemo.pageLink}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>
        </div>

        <div className={styles.demosFooter}>
          <Link className={styles.textLink} href={`/${locale}/learn`}>
            <Play size={14} aria-hidden="true" />
            {c.moreFilms}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className={styles.trust} id="trust" aria-labelledby="trust-title">
        <h2 id="trust-title">{c.trustTitle}</h2>
        <div className={styles.trustItems}>
          {c.trust.map((item, i) => (
            <div key={item.title}>
              <span>0{i + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
        <Link className={styles.textLink} href={`/${locale}/privacy`}>
          {c.privacy}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>

      <section className={styles.intro} id="vision" aria-labelledby="vision-title">
        <h2 id="vision-title">{c.visionTitle}</h2>
        <p>{c.visionBody}</p>
        <div className={styles.visionLinks}>
          <a className={styles.textLink} href={`${docHome}product`}>
            {c.visionLink}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <Link className={styles.textLink} href={`/${locale}/ada`}>
            {c.everydayLink}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className={styles.downloads}>
        <ProductDesktopDownloads id="download" d={L.download} title={c.downloadTitle} desc={c.downloadDesc} />
        <div className={styles.otherWays}>
          <a className={styles.textLink} href="#mobile-download">
            {c.mobileDownload}
            <ArrowDown size={15} aria-hidden="true" />
          </a>
          <a className={styles.textLink} href={LANDING_GITHUB_REPO} target="_blank" rel="noopener noreferrer">
            <Github size={16} aria-hidden="true" />
            GitHub
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
        <details className={styles.terminal} id="terminal-install">
          <summary>
            <Terminal size={16} aria-hidden="true" />
            {L.download.terminalSectionTitle}
          </summary>
          <TerminalInstallCommands
            commands={[
              { label: L.download.terminalUnixLabel, value: L.download.terminalUnixCommand, method: "unix" },
              { label: L.download.terminalWindowsLabel, value: L.download.terminalWindowsCommand, method: "windows" },
            ]}
            copyLabel={L.download.terminalCopy}
            copiedLabel={L.download.terminalCopied}
          />
        </details>
      </div>

      <MobileDownloads d={L.download} locale={locale} />
      <LandingFooter footer={L.footer} docsHref={docHome} locale={locale} />
    </div>
  );
}
