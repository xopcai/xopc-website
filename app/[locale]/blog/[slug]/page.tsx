import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BlogShell } from "@/components/blog/blog-shell";
import { MemoryCover } from "@/components/blog/memory-figures";
import { MemoryArticleBody } from "@/content/blog/when-memory-changes.zh";
import { memoryArticle, memoryArticlePath, memoryArticleSections } from "@/lib/blog";
import { isLocale } from "@/lib/i18n/config";

type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return [{ locale: "zh", slug: memoryArticle.slug }]; }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || slug !== memoryArticle.slug) return {};
  return { title: memoryArticle.title, description: memoryArticle.description, alternates: { canonical: memoryArticlePath, languages: { zh: memoryArticlePath } }, openGraph: { title: memoryArticle.title, description: memoryArticle.description, type: "article", locale: "zh_CN", alternateLocale: [], url: memoryArticlePath, publishedTime: `${memoryArticle.date}T00:00:00+08:00`, authors: [memoryArticle.author], images: [{ url: "/media/blog/when-memory-changes.png", width: 1200, height: 630, alt: memoryArticle.title }] }, twitter: { card: "summary_large_image", title: memoryArticle.title, description: memoryArticle.description, images: ["/media/blog/when-memory-changes.png"] } };
}
export default async function BlogArticle({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || slug !== memoryArticle.slug) notFound();
  if (locale !== "zh") redirect(memoryArticlePath);
  const structuredData = { "@context": "https://schema.org", "@type": "BlogPosting", headline: memoryArticle.title, description: memoryArticle.description, inLanguage: "zh-CN", datePublished: `${memoryArticle.date}T00:00:00+08:00`, author: { "@type": "Organization", name: "xopc", url: "https://xopc.ai" }, mainEntityOfPage: `https://xopc.ai${memoryArticlePath}`, image: "https://xopc.ai/media/blog/when-memory-changes.png" };
  return <BlogShell locale="zh">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <article>
      <header className="blog-article-header"><Link className="blog-back" href="/zh/blog">← 全部文章</Link><p className="blog-eyebrow">INSIDE XOPC / 01 · 记忆</p><h1>{memoryArticle.title}</h1><p className="blog-intro">{memoryArticle.description}</p><div className="blog-meta"><span>{memoryArticle.author}</span><time dateTime={memoryArticle.date}>2026 年 9 月 21 日</time><span>{memoryArticle.readingTime}</span><span>中文首发</span></div></header>
      <div className="blog-hero"><MemoryCover /></div>
      <div className="blog-article-layout"><MemoryArticleBody /><aside className="blog-toc" aria-label="文章目录"><p>本文内容</p>{memoryArticleSections.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}<a href="#sources">实现与测试 ↗</a></aside></div>
    </article>
  </BlogShell>;
}
