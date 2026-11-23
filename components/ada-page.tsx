import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AdaCompanion } from "@/components/ada-companion";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";
import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { LandingNavState } from "@/components/landing-nav-state";
import { ProductFilmButton } from "@/components/product-film-button";
import { ProductIntroVideo } from "@/components/product-intro-video";
import captures from "@/content/ada/previews.json";
import { adaFilm } from "@/lib/ada";
import { adaCopy } from "@/lib/ada-copy";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import storyStyles from "./landing-story.module.css";
import styles from "./ada-page.module.css";

type Props = { locale: Locale; messages: Messages; docHome: string };

export function AdaPage({ locale, messages, docHome }: Props) {
  const c = adaCopy[locale];
  const film = adaFilm(locale);
  const images = captures.locales[locale];
  const download = `/${locale}#download`;

  return (
    <div className={`landing-page ${storyStyles.page} ${styles.page}`}>
      <LandingLocaleTransition />
      <LandingNavState />
      <LandingHeader locale={locale} header={messages.header} nav={messages.landing.nav} docHome={docHome} activePage="ada" />

      <section className={styles.hero} aria-labelledby="ada-title">
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{c.eyebrow}</p>
          <h1 id="ada-title">
            {c.headline[0]}
            <span>{c.headline[1]}</span>
          </h1>
          <p className={styles.description}>{c.description}</p>
          <AdaCompanion locale={locale} />
          <div className={styles.actions}>
            <a className={styles.primary} href={download} data-product-event="ada_download_clicked">
              {c.download}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <ProductFilmButton locale={locale} film={film} title={c.film} label={c.watch} />
          </div>
          <p className={styles.included}>{c.included}</p>
          <a className={styles.scrollLine} href="#ada-preview" aria-label={c.watch}>
            <span aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className={styles.previewSection} id="ada-preview" aria-label={c.film}>
        <div className={storyStyles.film}>
          <ProductIntroVideo locale={locale} variant="ada" />
        </div>
        <p className={styles.previewCaption}>{c.demo}</p>
      </section>

      <section className={styles.introduction} aria-labelledby="ada-introduction">
        <h2 id="ada-introduction">{c.introduction}</h2>
        <p>{c.introductionBody}</p>
      </section>

      <div className={styles.stages}>
        {c.stages.map((stage, index) => {
          const image = images[stage.image];
          const start = film.chapters[stage.chapter].start;
          return (
            <section className={styles.stage} key={stage.image} aria-labelledby={`ada-step-${index}`}>
              <div className={styles.stageCopy}>
                <p className={styles.number}>0{index + 1}</p>
                <h2 id={`ada-step-${index}`}>{stage.title}</h2>
                <p>{stage.body}</p>
                <ProductFilmButton
                  locale={locale}
                  film={film}
                  title={c.film}
                  label={stage.watch}
                  start={start}
                  analyticsMethod={`ada-chapter-${index + 1}`}
                />
              </div>
              <div className={styles.stagePreview}>
                <div className={styles.screen} tabIndex={0} role="region" aria-label={stage.alt}>
                  <Image
                    src={image.src}
                    width={image.width}
                    height={image.height}
                    alt={stage.alt}
                    sizes="(max-width: 720px) 600px, 720px"
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className={styles.capabilities} aria-labelledby="ada-capabilities">
        <div className={styles.capabilitiesHead}>
          <p className={styles.eyebrow}>ADA · CAPABILITIES</p>
          <h2 id="ada-capabilities">{c.capabilitiesTitle}</h2>
          <p>{c.capabilitiesDesc}</p>
        </div>
        <div className={styles.capabilityRows}>
          {c.capabilities.map((item, idx) => (
            <article key={item.title} className={styles.capabilityRow}>
              <span className={styles.capabilityNum}>0{idx + 1}</span>
              <div className={styles.capabilityTitleCol}>
                <small>{item.tag}</small>
                <h3>{item.title}</h3>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.relationship} aria-labelledby="ada-xopc">
        <p className={styles.eyebrow}>Ada + xopc</p>
        <h2 id="ada-xopc">{c.relationship}</h2>
        <p>{c.relationshipBody}</p>
        <div className={styles.links}>
          <Link href={`/${locale}#loop`}>
            {c.workspace}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link href={`/${locale}/learn`}>
            {c.learn}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className={styles.faq} aria-labelledby="ada-faq">
        <h2 id="ada-faq">{c.faqTitle}</h2>
        {c.faqs.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
        <Link href={`/${locale}/privacy`}>
          {c.privacy}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>

      <section className={styles.closing} aria-labelledby="ada-closing">
        <span className={styles.closingRule} aria-hidden="true" />
        <h2 id="ada-closing">{c.closing}</h2>
        <p>{c.closingBody}</p>
        <a className={styles.primary} href={download} data-product-event="ada_download_clicked">
          {c.download}
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </section>

      <LandingFooter footer={messages.landing.footer} docsHref={docHome} locale={locale} />
    </div>
  );
}
