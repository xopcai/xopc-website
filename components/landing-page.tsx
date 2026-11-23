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
import { LandingStory } from "@/components/landing-story";
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

          <a className={styles.scrollLine} href="#film" aria-label={c.filmEyebrow}>
            <span aria-hidden="true" />
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
        <p className={styles.filmNote}>{c.filmNote}</p>
        <Link className={styles.textLink} href={`/${locale}/learn`}>
          <Play size={14} aria-hidden="true" />
          {c.moreFilms}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </section>

      <LandingStory locale={locale} />

      <section className={styles.editorial} id="capabilities" aria-labelledby="editorial-title">
        <div className={styles.editorialIntro}>
          <p className={styles.filmEyebrow}>{c.spreads.eyebrow}</p>
          <h2 id="editorial-title">{c.spreads.title}</h2>
        </div>

        <article className={styles.spread}>
          <div className={styles.spreadCopy}>
            <p className={styles.spreadIndex}>
              <span>{c.spreads.work.num}</span>
              {c.spreads.work.tag}
            </p>
            <h3>{c.spreads.work.title}</h3>
            <p>{c.spreads.work.body}</p>
            <div className={styles.spreadActions}>
              <ProductFilmButton
                locale={locale}
                film={work}
                title={work.title}
                label={c.spreads.work.watch}
                className={styles.watchFilm}
                analyticsMethod="work-overview"
              />
              <Link className={styles.textLink} href={`/${locale}/use-cases`}>
                {c.spreads.work.linkLabel}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className={styles.spreadMedia}>
            <ProductFilmButton
              locale={locale}
              film={work}
              title={work.title}
              label={`${c.spreads.work.watch} · ${work.duration}`}
              className={styles.mediaTrigger}
              analyticsMethod="work-poster"
            >
              <Image
                src={work.poster}
                alt={c.spreads.work.alt}
                width={1280}
                height={720}
                sizes="(max-width: 849px) 92vw, 660px"
              />
              <span className={styles.mediaPlay}>
                <Play size={16} fill="currentColor" aria-hidden="true" />
                <span>{work.duration}</span>
              </span>
            </ProductFilmButton>
          </div>
        </article>

        <article className={`${styles.spread} ${styles.spreadReverse}`}>
          <div className={styles.spreadCopy}>
            <p className={styles.spreadIndex}>
              <span>{c.spreads.ada.num}</span>
              {c.spreads.ada.tag}
            </p>
            <h3>{c.spreads.ada.title}</h3>
            <p>{c.spreads.ada.body}</p>
            <div className={styles.spreadActions}>
              <ProductFilmButton
                locale={locale}
                film={ada}
                title={c.spreads.ada.title.replace("\n", " ")}
                label={c.spreads.ada.watch}
                className={styles.watchFilm}
                analyticsMethod="ada-home"
              />
              <Link className={styles.textLink} href={`/${locale}/ada`}>
                {c.spreads.ada.linkLabel}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className={styles.spreadMedia}>
            <ProductFilmButton
              locale={locale}
              film={ada}
              title={c.spreads.ada.title.replace("\n", " ")}
              label={`${c.spreads.ada.watch} · ${ada.duration}`}
              className={styles.mediaTrigger}
              analyticsMethod="ada-poster"
            >
              <Image
                src={ada.poster}
                alt={c.spreads.ada.alt}
                width={1280}
                height={720}
                sizes="(max-width: 849px) 92vw, 660px"
              />
              <span className={styles.mediaPlay}>
                <Play size={16} fill="currentColor" aria-hidden="true" />
                <span>{ada.duration}</span>
              </span>
            </ProductFilmButton>
          </div>
        </article>

        <div className={styles.editorialRows}>
          {c.spreads.rows.map((row) => (
            <div key={row.num} className={styles.editorialRow}>
              <span className={styles.rowNum}>{row.num}</span>
              <h3>{row.title}</h3>
              <div className={styles.rowRight}>
                <p>{row.body}</p>
                <Link className={styles.textLink} href={`/${locale}/${row.href}`}>
                  {row.linkLabel}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.vision} id="vision" aria-labelledby="vision-title">
        <span className={styles.visionRule} aria-hidden="true" />
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
