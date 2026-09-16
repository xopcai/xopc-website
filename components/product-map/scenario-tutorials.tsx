"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { courses } from "@/components/learn/courses";
import catalog from "@/content/tutorials/catalog.json";
import type { Locale } from "@/lib/i18n/config";

type Tutorial = (typeof catalog.tutorials)[number] & { materials?: string };
type Article = { boundaries?: string[]; steps: { id: string; title: string; summary: string; points: string[]; image: string; instructions?: string[] }[] };

export function TutorialPlayer({ tutorial, locale, focused = false }: { tutorial: Tutorial; locale: Locale; focused?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [failed, setFailed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const activeChapter = tutorial.chapters.findLastIndex(chapter => chapter.startSeconds <= currentTime);
  const zh = locale === "zh";
  useEffect(() => {
    const controller = new AbortController();
    fetch(tutorial.article, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Article unavailable"); return response.json(); })
      .then(setArticle).catch(error => { if (error.name !== "AbortError") setFailed(true); });
    return () => controller.abort();
  }, [tutorial.article]);
  return <section className="pm-tutorial">
    {!focused && <h3>{tutorial.title}</h3>}
    {!focused && <p>{zh ? "中文配音与字幕 · PC 使用教程" : "Chinese narration and captions · Desktop tutorial"} · {Math.round(tutorial.durationSeconds)}{zh ? " 秒" : " sec"}</p>}
    {!focused && tutorial.materials && <a className="pm-primary" href={tutorial.materials} download>{zh ? "下载跟做材料（虚构示例）" : "Download practice files (fictional examples)"}</a>}
    <video ref={video} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)} controls playsInline preload="none" poster={tutorial.poster} aria-label={tutorial.title}>
      <source src={tutorial.video} type="video/mp4"/>
      <track kind="captions" src={tutorial.captions} srcLang="zh-CN" label="简体中文"/>
    </video>
    <div className="pm-chips">{tutorial.chapters.map((chapter, index) => <button aria-current={activeChapter === index ? "step" : undefined} key={chapter.startSeconds} onClick={() => {
      if (!video.current) return;
      video.current.currentTime = chapter.startSeconds;
      void video.current.play().catch(() => {});
    }}>{chapter.title}</button>)}</div>
    {focused && tutorial.materials && <a className="pm-primary" href={tutorial.materials} download>{zh ? "下载练习材料" : "Download practice files"}</a>}
    {!focused && !!article?.boundaries?.length && <aside>
      <h4>{zh ? "本课范围" : "Tutorial scope (Chinese)"}</h4>
      <ul>{article.boundaries.map(boundary => <li key={boundary}>{boundary}</li>)}</ul>
    </aside>}
    <details><summary>{zh ? "查看图文步骤" : "View illustrated steps (Chinese)"}</summary>
      {focused && !!article?.boundaries?.length && <aside><h4>{zh ? "本课范围" : "Tutorial scope (Chinese)"}</h4><ul>{article.boundaries.map(boundary => <li key={boundary}>{boundary}</li>)}</ul></aside>}
      {article ? article.steps.map(step => <section key={step.id}>
        <h4>{step.title}</h4><p>{step.summary}</p><ul>{step.points.map(point => <li key={point}>{point}</li>)}</ul>
        {step.instructions?.map((line, index) => <p key={index}>{line}</p>)}
        {/* Reviewed release images retain their original aspect ratio. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" src={`${tutorial.article.slice(0, tutorial.article.lastIndexOf("/") + 1)}${step.image}`} alt={step.title}/>
      </section>) : <p role="status">{failed ? (zh ? "图文暂时无法加载，请刷新重试。" : "Unable to load steps. Please refresh.") : (zh ? "正在加载图文…" : "Loading steps…")}</p>}
    </details>
  </section>;
}

export function ScenarioTutorials({ nodeId, locale }: { nodeId: string; locale: Locale }) {
  const related = courses.filter(course => course.nodes.some(node => node === nodeId));
  return <>
    {catalog.tutorials.filter(tutorial => !tutorial.id.startsWith("scenario-") && tutorial.mapNodeIds.includes(nodeId)).map(tutorial =>
      <TutorialPlayer key={`${tutorial.id}-${tutorial.locale}`} tutorial={tutorial} locale={locale}/>)}
    {related.length > 0 && <section className="pm-tutorial">
      <h3>{locale === "zh" ? "用这个功能完成一件事" : "Put this feature into practice"}</h3>
      <div className="pm-chips">{related.map(course => <Link key={course.id} href={`/${locale}/learn?course=${course.id}`}>{course[locale].title} →</Link>)}</div>
    </section>}
  </>;
}
