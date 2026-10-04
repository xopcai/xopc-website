"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CheckCheck, FileText, LockKeyhole, MessageCircle, RotateCcw, Signal, Wifi } from "lucide-react";
import { Loopi } from "@/components/brand/loopi";
import { storyCopy } from "@/lib/landing-story-copy";
import type { Locale } from "@/lib/i18n/config";
import styles from "./landing-story.module.css";

export function LandingStory({ locale }: { locale: Locale }) {
  const c = storyCopy[locale];
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    host.dataset.enhanced = "true";
    const chapters = Array.from(host.querySelectorAll<HTMLElement>("[data-chapter]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const target = window.innerHeight * 0.5;
      let nearest = 0;
      let distance = Infinity;
      chapters.forEach((chapter, i) => {
        const box = chapter.getBoundingClientRect();
        const d = Math.abs(box.top + box.height / 2 - target);
        if (d < distance) { distance = d; nearest = i; }
      });
      setActive(nearest);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete host.dataset.enhanced;
    };
  }, []);

  function goTo(index: number) {
    const target = root.current?.querySelector<HTMLElement>(`[data-chapter="${index}"]`);
    target?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: matchMedia("(min-width: 850px) and (min-height: 680px)").matches ? "center" : "start" });
  }

  const scene = (index: number) => <div className={styles.scene} data-scene={index}>
    {index === 0 && <>
      <div className={styles.userMessage}><MessageCircle size={16} /><p>{c.ask}</p></div>
      <div className={styles.companionLine}><Loopi variant="avatar" mood="listen" /><span>{c.context}</span></div>
      <div className={styles.sources}>{c.sources.map((source, i) => <span key={source} style={{ animationDelay: `${i * 100}ms` }}><FileText size={14} />{source}</span>)}</div>
      <div className={styles.evidence}><span>{c.fact}</span><p>{c.factBody}</p></div>
      <div className={`${styles.evidence} ${styles.inference}`}><span>{c.inference}</span><p>{c.inferenceBody}</p></div>
    </>}
    {index === 1 && <>
      <Loopi mood={approved ? "done" : "decision"} className={styles.decisionLoopi} />
      <div className={styles.decisionCard}><span className={styles.decisionLabel}><LockKeyhole size={13} />{c.approved}</span><h3>{c.decision}</h3><p>{c.decisionBody}</p>
        <button type="button" className={styles.confirm} data-confirmed={approved} onClick={() => { if (approved) goTo(2); else setApproved(true); }}>{approved ? <Check size={17} /> : <ArrowRight size={17} />}{approved ? c.confirmed : c.confirm}</button>
        <div className={styles.decisionStatus} role="status">{approved ? c.result : c.approvalNote}</div>
      </div>
    </>}
    {index === 2 && <>
      <div className={styles.companionLine}><Loopi variant="avatar" mood="done" /><span>{c.result}</span></div>
      <p className={styles.exampleNote}>{c.exampleResult}</p>
      <div className={styles.taskList}>{c.tasks.map((task, i) => <div key={task} style={{ animationDelay: `${i * 130}ms` }}><Check size={17} /><span>{task}</span></div>)}</div>
      <div className={styles.outputFile}><FileText size={28} /><div><strong>{c.file}</strong><p>{c.fileBody}</p></div><span>{c.ready}</span></div>
    </>}
    {index === 3 && <div className={styles.phoneScene}>
      <div className={styles.phone}><div className={styles.phoneStatus}><span>{c.phoneTime}</span><span><Signal size={13} /><Wifi size={13} /></span></div><div className={styles.phoneNotch} />
        <div className={styles.phoneHeader}><Loopi variant="avatar" mood="care" /><strong>xopc</strong><span>{c.project}</span></div>
        <p className={styles.phoneAsk}>{c.phoneAsk}</p><p className={styles.phoneReply}>{c.phoneReply}</p>
        <div className={styles.phoneArtifact}><FileText size={18} /><span>{c.file}</span><Check size={15} /></div>
        <div className={styles.phoneConnected}><span />{c.connected}</div><div className={styles.phoneHome} />
      </div><span className={styles.continuity}><CheckCheck size={16} />{c.continuity}</span>
    </div>}
  </div>;

  return <div ref={root} className={styles.storyRoot}>
    <section className={styles.intro} id="why"><p className={styles.eyebrow}>{c.introLabel}</p><h2><span>{c.intro[0]}</span><br />{c.intro[1]}</h2><p>{c.introDesc}</p><span className={styles.introLine} /></section>
    <section className={styles.journey} id="loop" aria-label={c.chapterLabel}>
      <div className={styles.chapters}>{c.chapters.map((chapter, i) => <article data-chapter={i} key={chapter.time} className={styles.chapter}>
        <div className={styles.chapterCopy}><p className={styles.eyebrow}><span className={styles.chapterNumber}>0{i + 1}</span>{chapter.time}</p><h2>{chapter.title}</h2><p>{chapter.body}</p><span className={styles.chapterAside}>{chapter.aside}</span></div>
        <div className={styles.inlineScene}><p className={styles.demoLabel}>{c.demoLabel}</p>{scene(i)}{i === 1 && approved && <button type="button" className={styles.nextStory} onClick={() => setApproved(false)}><RotateCcw size={14} aria-hidden />{c.reset}</button>}</div>
      </article>)}</div>
      <div className={styles.stageColumn}><div className={styles.stickyStage}>
        <div className={styles.stageHeader}><span><i /><i /><i /></span><span>{c.project}</span><LockKeyhole size={13} /></div>
        <div className={styles.stageBody}>{c.steps.map((step, i) => <div key={step} className={styles.scenePanel} data-active={active === i} aria-hidden={active !== i} inert={active !== i}>{scene(i)}</div>)}</div>
        <div className={styles.storyArtifact} data-complete={active >= 2 || approved} data-phone={active === 3}><FileText size={21} /><div><strong>{c.file}</strong><p>{active === 3 ? c.artifactPhone : active >= 2 || approved ? c.artifactAfter : c.artifactBefore}</p></div><span>{active >= 2 || approved ? <Check size={18} /> : "01"}</span></div>
        <div className={styles.stageBottom}><span>{c.demoLabel}</span><button type="button" onClick={() => { setApproved(false); goTo(0); }} aria-label={c.reset}><RotateCcw size={14} /></button></div>
        <div className={styles.chapterNav} aria-label={c.chapterLabel}>{c.steps.map((step, i) => <button type="button" key={step} onClick={() => goTo(i)} aria-current={active === i ? "step" : undefined}><span>0{i + 1}</span>{step}</button>)}</div>
      </div></div>
    </section>
    <div className={styles.recap}><span /><p>{c.recap}</p><span /></div>
  </div>;
}
