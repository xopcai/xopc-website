import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogShell } from "@/components/blog/blog-shell";
import { MemoryCover } from "@/components/blog/memory-figures";
import { isLocale } from "@/lib/i18n/config";
import { memoryArticle, memoryArticlePath } from "@/lib/blog";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const title = locale === "zh" ? "技术博客 · Inside xopc" : "Engineering blog · Inside xopc";
  const description = locale === "zh" ? "拆开 xopc 的工程设计：真实问题、实现取舍与可检查的证据。" : "Engineering decisions behind xopc: real problems, trade-offs and evidence. Articles are currently available in Chinese.";
  return { title, description, alternates: { canonical: `/${locale}/blog`, languages: { zh: "/zh/blog", en: "/en/blog" } }, openGraph: { title, description, url: `/${locale}/blog`, type: "website" } };
}
export default async function BlogIndex({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const zh = locale === "zh";
  return <BlogShell locale={locale}>
    <header className="blog-index-header"><p className="blog-eyebrow">INSIDE XOPC</p><h1>{zh ? "把设计讲清楚。" : "The decisions behind xopc."}</h1><p className="blog-intro">{zh ? "从一个具体问题开始，拆开实现，讨论取舍。关于个人 Agent 的工程笔记。" : "Engineering notes on personal agents. A closer look at the problems, implementations and trade-offs. Our first article is available in Chinese."}</p></header>
    <article className="blog-index-card"><Link href={memoryArticlePath} aria-label={memoryArticle.title}><MemoryCover /></Link><div lang="zh-CN"><div className="blog-meta"><time dateTime={memoryArticle.date}>2026 年 9 月 21 日</time><span>工程 · 记忆</span><span>{zh ? memoryArticle.readingTime : "中文 · Chinese"}</span></div><h2><Link href={memoryArticlePath}>{memoryArticle.title}</Link></h2><p>{memoryArticle.description}</p><Link className="blog-read" href={memoryArticlePath}>{zh ? "阅读全文 →" : "Read in Chinese →"}</Link></div></article>
  </BlogShell>;
}
