import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogShell } from "@/components/blog/blog-shell";
import { isLocale } from "@/lib/i18n/config";
import { getBlogArticles, blogDate } from "@/lib/blog";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const title = locale === "zh" ? "技术博客 · Inside xopc" : "Engineering blog · Inside xopc";
  const description = locale === "zh" ? "分享 xopc 背后的技术设计，以及构建个人 AI 助理过程中的经验与思考。" : "Engineering decisions behind xopc: real problems, implementation details, and trade-offs.";
  return { title, description, alternates: { canonical: `/${locale}/blog`, languages: { zh: "/zh/blog", en: "/en/blog" } }, openGraph: { title, description, url: `/${locale}/blog`, type: "website" } };
}
export default async function BlogIndex({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const zh = locale === "zh";
  return <BlogShell locale={locale}>
    <header className="blog-index-header">
      <p className="blog-eyebrow">{zh ? "技术博客" : "ENGINEERING BLOG"}</p>
      <h1>Inside xopc</h1>
      <p className="blog-intro">{zh ? "分享 xopc 背后的技术设计，以及构建个人 AI 助理过程中的经验与思考。" : "The technical decisions behind xopc, and what we learn while building a personal AI assistant."}</p>
    </header>
    {getBlogArticles(locale).map((article, index) => <article className="blog-index-card" key={article.slug}>
      <Link href={article.path} aria-label={article.title}><Image src={article.cover} alt={article.title} width={1200} height={630} priority={index === 0} /></Link>
      <div lang={article.language}>
        <div className="blog-meta"><time dateTime={article.date}>{blogDate(article.date, locale)}</time><span>{article.number} · {article.category}</span><span>{article.readingTime}</span></div>
        <h2><Link href={article.path}>{article.title}</Link></h2>
        <p>{article.description}</p>
        <Link className="blog-read" href={article.path}>{zh ? "阅读全文 →" : "Read article →"}</Link>
      </div>
    </article>)}
  </BlogShell>;
}
