import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ProductFilmButton } from "@/components/product-film-button";
import previews from "@/content/marketing/experience-previews.json";
import { experienceCopy } from "@/lib/experience-copy";
import type { Locale } from "@/lib/i18n/config";
import { personalAi } from "@/lib/personal-ai";
import styles from "./landing-experiences.module.css";

export function PersonalAiSection({ locale }: { locale: Locale }) {
  const c = experienceCopy[locale];
  const film = personalAi(locale);
  const capture = previews.captures[locale === "zh" ? "personal-zh" : "personal-en"];
  return <section className={styles.section} id="personal-ai" aria-labelledby="personal-ai-title">
    <div className={styles.heading}>
      <div><p className={styles.eyebrow}>Personal AI</p><h2 id="personal-ai-title">{c.personal.headline}</h2><p className={styles.description}>{c.personal.description}</p></div>
      <div className={styles.actions}><ProductFilmButton locale={locale} film={film} title={c.personal.film} label={c.personal.watch} /><a href="#download">{c.try}<ArrowUpRight size={15} aria-hidden="true" /></a></div>
    </div>
    <figure className={styles.personalPreview}>
      <div className={styles.personalScreen} tabIndex={0} role="region" aria-label={c.personal.alt}><Image src={capture.src} width={capture.width} height={capture.height} alt={c.personal.alt} sizes="(max-width: 720px) 760px, 1000px" /></div>
      <figcaption>{c.personal.caption}<span className={styles.mobileHint}> · {locale === "zh" ? "左右滑动查看对话" : "Swipe to read the conversation"}</span></figcaption>
    </figure>
    <div className={styles.points}>{c.personal.points.map((point, index) => <div key={point.title}><span>0{index + 1}</span><h3>{point.title}</h3><p>{point.body}</p></div>)}</div>
  </section>;
}
