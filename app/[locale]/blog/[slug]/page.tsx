import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogShell } from "@/components/blog/blog-shell";
import { MarkdownArticle } from "@/components/blog/markdown-article";
import { blogArticles, blogAlternates, blogDate, getBlogArticle } from "@/lib/blog";
import { isLocale } from "@/lib/i18n/config";

type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() {
  return blogArticles.map(({ slug, locale }) => ({ locale, slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = getBlogArticle(slug, locale);
  if (!article) return {};
  return {
    title: article.title, description: article.description,
    alternates: { canonical: article.path, languages: blogAlternates(slug) },
    openGraph: {
      title: article.title, description: article.description, type: "article",
      locale: locale === "zh" ? "zh_CN" : "en_US", alternateLocale: [locale === "zh" ? "en_US" : "zh_CN"], url: article.path,
      publishedTime: `${article.date}T00:00:00+08:00`, authors: [article.author],
      images: [{ url: article.cover, width: 1200, height: 630, alt: article.title }],
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.description, images: [article.cover] },
  };
}
export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const article = getBlogArticle(slug, locale);
  if (!article) notFound();
  const zh = locale === "zh";
  const structuredData = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: article.title, description: article.description, inLanguage: article.language,
    datePublished: `${article.date}T00:00:00+08:00`,
    author: { "@type": "Organization", name: article.author, url: "https://xopc.ai" },
    mainEntityOfPage: `https://xopc.ai${article.path}`, image: `https://xopc.ai${article.cover}`,
  };
  return <BlogShell locale={locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <article lang={article.language}>
      <header className="blog-article-header">
        <Link className="blog-back" href={`/${locale}/blog`}>{zh ? "← 全部文章" : "← All articles"}</Link>
        <p className="blog-eyebrow">INSIDE XOPC / {article.number} · {article.category}</p>
        <h1>{article.title}</h1>
        <p className="blog-intro">{article.description}</p>
        <div className="blog-meta"><span>{article.author}</span><time dateTime={article.date}>{blogDate(article.date, locale)}</time><span>{article.readingTime}</span><Link href={`/${zh ? "en" : "zh"}/blog/${slug}`} hrefLang={zh ? "en" : "zh"} lang={zh ? "en" : "zh-CN"}>{zh ? "Read in English" : "阅读中文版"}</Link></div>
      </header>
      <div className="blog-hero"><Image src={article.cover} alt={article.title} width={1200} height={630} priority /></div>
      <div className="blog-article-layout">
        <MarkdownArticle locale={locale} content={article.content} assetBase={article.assetBase} sections={article.sections} figures={article.figures} />
        <aside className="blog-toc" aria-label={zh ? "文章目录" : "Table of contents"}>
          <p>{zh ? "本文内容" : "In this article"}</p>
          {article.sections.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}
          <a className="blog-download" href={article.assetBase + `/${locale}.md`} download>{zh ? "下载 Markdown ↓" : "Download Markdown ↓"}</a>
        </aside>
      </div>
    </article>
  </BlogShell>;
}
