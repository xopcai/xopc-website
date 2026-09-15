"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play, X, Download } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { TutorialPlayer } from "@/components/product-map/scenario-tutorials";
import { courses } from "./courses";
import catalog from "@/content/tutorials/catalog.json";
import { getProductMapMessages } from "@/lib/product-map/messages";
import type { NodeId } from "@/lib/product-map/model";
import type { Locale } from "@/lib/i18n/config";

export function CourseLibrary({
  locale,
  initialCourse,
}: {
  locale: Locale;
  initialCourse: string;
}) {
  const zh = locale === "zh";
  const [selected, setSelected] = useState(
    courses.some((c) => c.id === initialCourse) ? initialCourse : "",
  );
  const drawer = useRef<HTMLDialogElement>(null);
  const course = courses.find((c) => c.id === selected);
  const tutorial = catalog.tutorials.find((t) => t.id === selected);
  useEffect(() => {
    const dialog = drawer.current;
    if (selected) dialog?.showModal();
    else dialog?.close();
    const previous = document.body.style.overflow;
    if (selected) document.body.style.overflow = "hidden";
    window.history.replaceState(
      null,
      "",
      `/${locale}/learn${selected ? `?course=${selected}` : ""}`,
    );
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected, locale]);
  return (
    <div className="landing-page product-atlas learn-page site-page site-learn">
      <SiteHeader
        locale={locale}
        active="learn"
        locationSuffix={selected ? `?course=${selected}` : ""}
      />
      <main className="learn-main">
        <section className="learn-intro">
          <h1>{zh ? "用 xopc，做成一件事。" : "Make something happen."}</h1>
          <p>
            {zh ? "选一个场景，跟着做。" : "Pick a workflow. Follow along."}
          </p>
          <span className="learn-edition">
            {zh
              ? "6 个场景 · 中文视频 · 附练习材料"
              : "6 workflows · Chinese videos · Practice files included"}
          </span>
        </section>
        <section
          className="learn-grid"
          aria-label={zh ? "选择场景课程" : "Choose a course"}
        >
          {courses.map((c) => {
            const copy = c[locale];
            const media = catalog.tutorials.find((t) => t.id === c.id);
            return (
              <button
                className="learn-card"
                key={c.id}
                onClick={() => setSelected(c.id)}
              >
                <div className="learn-card-top">
                  <span>{copy.audience}</span>
                  <span>{c.icon}</span>
                </div>
                {media && (
                  <div className="learn-poster">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.poster} alt="" loading="lazy" />
                    <span>
                      <Play size={18} />
                      {Math.floor(media.durationSeconds / 60)}:
                      {String(Math.round(media.durationSeconds) % 60).padStart(
                        2,
                        "0",
                      )}
                    </span>
                  </div>
                )}
                <h2>{copy.title}</h2>
                <div className="learn-card-bottom">
                  <span>{zh ? "观看并跟做" : "Watch and practice"}</span>
                  <ArrowRight size={18} />
                </div>
              </button>
            );
          })}
        </section>
        <section className="learn-guide">
          <h2>{zh ? "边看，边做。" : "Watch. Try. Make it yours."}</h2>
          <ol>
            {(zh
              ? ["下载练习材料", "按章节操作", "核对并保存结果"]
              : [
                  "Download the practice files",
                  "Follow each chapter",
                  "Review and save the result",
                ]
            ).map((text, index) => (
              <li key={text}>
                <span>0{index + 1}</span>
                {text}
              </li>
            ))}
          </ol>
          <Link href={`/${locale}/product-map?node=models`}>
            {zh
              ? "第一次使用？从模型接入开始"
              : "New here? Connect your first model"}
            <ArrowRight size={16} />
          </Link>
          <p>
            {zh
              ? "真实界面截图讲解，示例材料为虚构。"
              : "Narrated desktop screenshots with fictional materials. Videos and detailed guides are in Chinese."}
          </p>
        </section>
      </main>
      <dialog
        className="pm-dialog pm-detail-drawer learn-drawer"
        ref={drawer}
        onClose={() => setSelected("")}
        aria-labelledby="learn-course-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const r = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < r.left ||
              event.clientX > r.right ||
              event.clientY < r.top ||
              event.clientY > r.bottom
            )
              setSelected("");
          }
        }}
      >
        <div className="pm-dialog-head">
          <span>{zh ? "场景实战" : "Practical workflow"}</span>
          <button
            onClick={() => setSelected("")}
            aria-label={zh ? "关闭课程" : "Close course"}
          >
            <X />
          </button>
        </div>
        <div className="pm-dialog-scroll" key={selected}>
          {course && (
            <>
              <p className="pm-eyebrow">{course[locale].audience}</p>
              <h2 id="learn-course-title">{course[locale].title}</h2>
              <p>{course[locale].outcome}</p>
              {tutorial && (
                <TutorialPlayer tutorial={tutorial} locale={locale} />
              )}
              <h3>{zh ? "相关功能" : "Related features"}</h3>
              <div className="pm-chips">
                {course.nodes.map((node) => (
                  <Link key={node} href={`/${locale}/product-map?node=${node}`}>
                    {getProductMapMessages(locale).nodes[node as NodeId].title}
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
              <p className="learn-download-note">
                <Download size={15} />
                {zh
                  ? "材料是独立示例，可重复解压练习；不要覆盖自己的正式资料。"
                  : "Practice files are standalone examples. Extract a fresh copy for another attempt."}
              </p>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
