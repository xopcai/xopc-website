import Image from "next/image";
import { ArrowDown, ArrowUpRight, MessageCircle, PanelsTopLeft, Play } from "lucide-react";
import { ProductFilmButton } from "@/components/product-film-button";
import previews from "@/content/marketing/experience-previews.json";
import { experienceCopy } from "@/lib/experience-copy";
import type { Locale } from "@/lib/i18n/config";
import { workFilm } from "@/lib/work-film";
import styles from "./landing-experiences.module.css";

export function ExperienceChoices({ locale }: { locale: Locale }) {
  const c = experienceCopy[locale];
  return <div className={styles.choices}>
    <p className={styles.choiceLabel}>{c.choose}</p>
    <div className={styles.choiceGrid}>
      <a href="#personal-ai" className={styles.choice}><MessageCircle size={25} strokeWidth={1.4} aria-hidden="true" /><div><h2>Personal AI</h2><p>{c.personalHint}</p><small>{c.personalTags}</small></div><ArrowDown size={19} aria-hidden="true" /></a>
      <a href="#work" className={styles.choice}><PanelsTopLeft size={25} strokeWidth={1.4} aria-hidden="true" /><div><h2>Work</h2><p>{c.workHint}</p><small>{c.workTags}</small></div><ArrowDown size={19} aria-hidden="true" /></a>
    </div>
  </div>;
}

export function WorkSection({ locale }: { locale: Locale }) {
  const c = experienceCopy[locale];
  const film = workFilm(locale);
  return <section className={styles.section} id="work" aria-labelledby="work-title">
    <div className={styles.heading}>
      <div><p className={styles.eyebrow}>Work</p><h2 id="work-title">{c.work.headline}</h2><p className={styles.description}>{c.work.description}</p></div>
      <div className={styles.actions}><ProductFilmButton locale={locale} film={film} title={c.work.film} label={c.work.watch} /><a href={`/${locale}/use-cases`}>{c.samples}<ArrowUpRight size={15} aria-hidden="true" /></a></div>
    </div>
    <div className={styles.outputs}>{c.work.points.map(point => {
      const capture = previews.captures[`${point.asset}-${locale}`];
      return <article className={styles.output} key={point.asset}>
        <ProductFilmButton locale={locale} film={film} title={`${c.work.film} · ${point.title}`} label={point.title} start={film.chapters[point.chapter].start} className={styles.outputPreview}>
          <Image src={capture.src} width={capture.width} height={capture.height} alt={point.alt} sizes="(max-width: 720px) calc(100vw - 64px), (max-width: 1050px) 45vw, 340px" />
          <span className={styles.previewPlay}><Play size={16} aria-hidden="true" /><span className={styles.srOnly}>{point.title}</span></span>
        </ProductFilmButton>
        <div className={styles.outputCopy}><h3>{point.title}</h3><p>{point.body}</p></div>
      </article>;
    })}</div>
    <div className={styles.workFoot}><p>{c.work.caption}</p><a href={`/${locale}/learn`}>{c.tutorials}<ArrowUpRight size={15} aria-hidden="true" /></a></div>
  </section>;
}

export function ExperienceBridge({ locale }: { locale: Locale }) {
  const c = experienceCopy[locale];
  return <section className={styles.bridge} id="why" aria-labelledby="experience-bridge-title">
    <span id="loop" aria-hidden="true" />
    <p className={styles.eyebrow}>{c.choose}</p><h2 id="experience-bridge-title">{c.bridgeTitle}</h2><p className={styles.description}>{c.bridgeDesc}</p>
    <ul className={styles.flow}>{c.bridge.map(step => <li key={step.label}><span>{step.mode}</span><h3>{step.label}</h3><p>{step.body}</p></li>)}</ul>
    <p className={styles.continuity}>{c.bridgeContinue}</p>
    <a className={styles.bridgeLink} href={`/${locale}/product-map`}>{c.explore}<ArrowUpRight size={15} aria-hidden="true" /></a>
  </section>;
}
