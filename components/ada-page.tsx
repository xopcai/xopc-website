import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";
import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { LandingNavState } from "@/components/landing-nav-state";
import { ProductFilmButton } from "@/components/product-film-button";
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
  return <div className={`landing-page ${storyStyles.page} ${styles.page}`}>
    <LandingLocaleTransition /><LandingNavState />
    <LandingHeader locale={locale} header={messages.header} nav={messages.landing.nav} docHome={docHome} activePage="ada" />
    <section className={styles.hero} aria-labelledby="ada-title">
      <p className={styles.eyebrow}>{c.eyebrow}</p>
      <h1 id="ada-title">{c.headline[0]}<span>{c.headline[1]}</span></h1>
      <p className={styles.description}>{c.description}</p>
      <div className={styles.actions}>
        <a className={styles.primary} href={download} data-product-event="ada_download_clicked">{c.download}<ArrowUpRight size={17} aria-hidden /></a>
        <ProductFilmButton locale={locale} film={film} title={c.film} label={c.watch} />
      </div>
      <p className={styles.included}>{c.included}</p>
      <figure className={styles.heroPreview}>
        <div className={styles.screen} tabIndex={0} role="region" aria-label={c.contextAlt}>
          <Image src={images.context.src} width={images.context.width} height={images.context.height} alt={c.contextAlt} sizes="(max-width: 720px) 640px, 1080px" preload />
        </div>
        <figcaption>{c.demo}</figcaption>
      </figure>
    </section>
    <section className={styles.introduction} aria-labelledby="ada-introduction">
      <h2 id="ada-introduction">{c.introduction}</h2><p>{c.introductionBody}</p>
    </section>
    <div className={styles.stages}>{c.stages.map((stage, index) => {
      const image = images[stage.image];
      return <section className={styles.stage} key={stage.image} aria-labelledby={`ada-step-${index}`}>
        <div className={styles.stageCopy}><p className={styles.number}>0{index + 1}</p><h2 id={`ada-step-${index}`}>{stage.title}</h2><p>{stage.body}</p>
          <ProductFilmButton locale={locale} film={film} title={c.film} label={stage.watch} start={film.chapters[stage.chapter].start} />
        </div>
        <div className={styles.stagePreview}><div className={styles.screen} tabIndex={0} role="region" aria-label={stage.alt}>
          <Image src={image.src} width={image.width} height={image.height} alt={stage.alt} sizes="(max-width: 720px) 600px, 720px" />
        </div></div>
      </section>;
    })}</div>
    <section className={styles.relationship} aria-labelledby="ada-xopc">
      <p className={styles.eyebrow}>Ada + xopc</p><h2 id="ada-xopc">{c.relationship}</h2><p>{c.relationshipBody}</p>
      <div className={styles.links}><a href={`/${locale}#loop`}>{c.workspace}<ArrowUpRight size={16} aria-hidden /></a><a href={`/${locale}/learn`}>{c.learn}<ArrowUpRight size={16} aria-hidden /></a></div>
    </section>
    <section className={styles.faq} aria-labelledby="ada-faq"><h2 id="ada-faq">{c.faqTitle}</h2>
      {c.faqs.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden>+</span></summary><p>{item.answer}</p></details>)}
      <a href={`/${locale}/privacy`}>{c.privacy}<ArrowUpRight size={15} aria-hidden /></a>
    </section>
    <section className={styles.closing} aria-labelledby="ada-closing"><h2 id="ada-closing">{c.closing}</h2><p>{c.closingBody}</p><a className={styles.primary} href={download} data-product-event="ada_download_clicked">{c.download}<ArrowUpRight size={17} aria-hidden /></a></section>
    <LandingFooter footer={messages.landing.footer} docsHref={docHome} locale={locale} />
  </div>;
}
