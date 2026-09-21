import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogShell } from "@/components/blog/blog-shell";
import Image from "next/image";
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
    <header className="blog-index-header"><p className="blog-eyebrow">{zh ? "技术博客" : "ENGINEERING BLOG"}</p><h1>Inside xopc</h1><p className="blog-intro">{zh ? "分享 xopc 背后的技术设计，以及构建个人 AI 助理过程中的经验与思考。" : "Engineering notes on personal agents. A closer look at the problems, implementations and trade-offs. Our first article is available in Chinese."}</p></header>
    <article className="blog-index-card"><Link href={memoryArticlePath} aria-label={memoryArticle.title}><Image src={memoryArticle.cover} alt="个人 Agent 的记忆如何随用户改变" width={1200} height={630} /></Link><div lang="zh-CN"><div className="blog-meta"><time dateTime={memoryArticle.date}>2026 年 9 月 21 日</time><span>工程 · 记忆</span><span>{zh ? memoryArticle.readingTime : "中文 · Chinese"}</span></div><h2><Link href={memoryArticlePath}>{memoryArticle.title}</Link></h2><p>{memoryArticle.description}</p><Link className="blog-read" href={memoryArticlePath}>{zh ? "阅读全文 →" : "Read in Chinese →"}</Link></div></article>
  </BlogShell>;
}
