"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Play, X, Download } from "lucide-react";
import { XopcLogoMark } from "@/components/xopc-logo-mark";
import { TutorialPlayer } from "@/components/product-map/scenario-tutorials";
import { courses } from "./courses";
import catalog from "@/content/tutorials/catalog.json";
import { getProductMapMessages } from "@/lib/product-map/messages";
import type { NodeId } from "@/lib/product-map/model";
import type { Locale } from "@/lib/i18n/config";

export function CourseLibrary({ locale, initialCourse }: { locale: Locale; initialCourse: string }) {
  const zh = locale === "zh";
  const [selected, setSelected] = useState(courses.some(c => c.id === initialCourse) ? initialCourse : "");
  const [category, setCategory] = useState("all");
  const visibleCourses = courses.filter(c => category === "all" || c.category === category);
  const drawer = useRef<HTMLDialogElement>(null);
  const course = courses.find(c => c.id === selected);
  const tutorial = catalog.tutorials.find(t => t.id === selected);
  const other = zh ? "en" : "zh";
  useEffect(() => {
    const dialog = drawer.current;
    if (selected) dialog?.showModal(); else dialog?.close();
    const previous = document.body.style.overflow;
    if (selected) document.body.style.overflow = "hidden";
    window.history.replaceState(null, "", `/${locale}/learn${selected ? `?course=${selected}` : ""}`);
    return () => { document.body.style.overflow = previous; };
  }, [selected, locale]);
  return <div className="landing-page product-atlas learn-page">
    <header className="pm-header"><Link className="pm-brand" href={`/${locale}`} aria-label="xopc"><XopcLogoMark/><b>xopc</b></Link><Link className="pm-home" href={`/${locale}/product-map`}><ArrowLeft size={16}/>{zh ? "产品探索" : "Explore"}</Link><div className="pm-header-tools"><a href={`/${other}/learn${selected ? `?course=${selected}` : ""}`} lang={other}>{zh ? "English" : "中文"}</a><Link className="pm-primary" href={`/${locale}#download`}>{zh ? "下载 xopc" : "Get xopc"}</Link></div></header>
    <main className="learn-main"><section className="learn-intro"><p className="pm-eyebrow">{zh ? "场景实战 · PC 端" : "PRACTICAL WORKFLOWS · DESKTOP"}</p><h1>{zh ? "从一件真实的事开始。" : "Start with something you need to do."}</h1><p>{zh ? "带着材料进入 xopc，核对过程，带走一份能继续使用的结果。" : "Bring your materials into xopc, review the work and leave with a useful result."}</p><div className="learn-tags"><span>{zh ? `${courses.length} 个完整场景` : `${courses.length} complete workflows`}</span><span>{zh ? "中文配音与字幕" : "Chinese narration & captions"}</span><span>{zh ? "可下载跟做材料" : "Downloadable practice files"}</span></div></section>
    <div role="group" className="learn-filters" aria-label={zh ? "课程分类" : "Course categories"}>{[{id:"all", zh:"全部", en:"All"},{id:"office", zh:"办公文件", en:"Office files"},{id:"everyday", zh:"日常协作", en:"Everyday workflows"}].map(item => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item[locale]}<span>{item.id === "all" ? courses.length : courses.filter(c => c.category === item.id).length}</span></button>)}</div>
    <section className="learn-grid" aria-label={zh ? "选择场景课程" : "Choose a course"}>{visibleCourses.map(c => {
      const copy = c[locale]; const media = catalog.tutorials.find(t => t.id === c.id);
      return <button className="learn-card" key={c.id} onClick={() => setSelected(c.id)}>
        <div className="learn-card-top"><span>{c.icon}</span><span>{copy.audience}</span></div>
        {media && <div className="learn-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.poster} alt="" loading="lazy"/><span><Play size={18}/>{Math.floor(media.durationSeconds / 60)}:{String(Math.round(media.durationSeconds) % 60).padStart(2, "0")}</span></div>}
        <h2>{copy.title}</h2><p>{copy.outcome}</p><div className="learn-result">{copy.result}</div><div className="learn-card-bottom"><span>{zh ? "观看并跟做" : "Watch and practice"}</span><ArrowRight size={18}/></div>
      </button>;
    })}</section><section className="learn-guide"><h2>{zh ? "怎样跟着做" : "How to follow along"}</h2><ol><li>{zh ? "先完成模型接入，下载课程中的虚构练习材料。" : "Connect a model and download the fictional practice files."}</li><li>{zh ? "观看章节，暂停视频，在自己的 xopc 中执行同一步骤。" : "Watch a chapter, pause and try the steps in your own xopc."}</li><li>{zh ? "核对来源、日期与实际保存结果，再换成自己的授权资料。" : "Check sources, dates and saved results before using your own authorized materials."}</li></ol><Link href={`/${locale}/product-map?node=models`}>{zh ? "回到功能地图，补齐基础操作" : "Review the basics in the product map"}<ArrowRight size={16}/></Link><p>{zh ? "视频结合真实 PC 界面截图与实际交付文件预览。示例人物和业务材料为虚构；英文页面的视频与详细教程仍为中文。" : "Videos combine real desktop screenshots with previews of actual deliverables. People and business materials are fictional. Videos and detailed guides are currently in Chinese."}</p></section></main>
    <dialog className="pm-dialog pm-detail-drawer learn-drawer" ref={drawer} onClose={() => setSelected("")} aria-labelledby="learn-course-title" onClick={event => {if (event.target === event.currentTarget) {const r = event.currentTarget.getBoundingClientRect();if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) setSelected("");}}}>
      <div className="pm-dialog-head"><span>{zh ? "场景实战" : "Practical workflow"}</span><button onClick={() => setSelected("")} aria-label={zh ? "关闭课程" : "Close course"}><X/></button></div>
      <div className="pm-dialog-scroll" key={selected}>{course && <><p className="pm-eyebrow">{course[locale].audience}</p><h2 id="learn-course-title">{course[locale].title}</h2><p>{course[locale].outcome}</p>{tutorial && <TutorialPlayer tutorial={tutorial} locale={locale}/>}<h3>{zh ? "相关功能" : "Related features"}</h3><div className="pm-chips">{course.nodes.map(node => <Link key={node} href={`/${locale}/product-map?node=${node}`}>{getProductMapMessages(locale).nodes[node as NodeId].title}<ArrowRight size={14}/></Link>)}</div><p className="learn-download-note"><Download size={15}/>{zh ? "材料是独立示例，可重复解压练习；不要覆盖自己的正式资料。" : "Practice files are standalone examples. Extract a fresh copy for another attempt."}</p></>}</div>
    </dialog>
  </div>;
}
