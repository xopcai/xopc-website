import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BlogShell } from "@/components/blog/blog-shell";
import { MarkdownArticle } from "@/components/blog/markdown-article";
import { blogArticles, blogDate, getBlogArticle } from "@/lib/blog";
import { isLocale } from "@/lib/i18n/config";

type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() {
  // Prebuild untranslated redirects too, avoiding a cold dynamic redirect response.
  return blogArticles.flatMap(({ slug }) => [{ locale: "zh", slug }, { locale: "en", slug }]);
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getBlogArticle(slug);
  if (!isLocale(locale) || !article) return {};
  return {
    title: article.title, description: article.description,
    alternates: { canonical: article.path, languages: { zh: article.path } },
    openGraph: {
      title: article.title, description: article.description, type: "article",
      locale: "zh_CN", alternateLocale: [], url: article.path,
      publishedTime: `${article.date}T00:00:00+08:00`, authors: [article.author],
      images: [{ url: article.cover, width: 1200, height: 630, alt: article.title }],
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.description, images: [article.cover] },
  };
}
export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const article = getBlogArticle(slug);
  if (!isLocale(locale) || !article) notFound();
  if (locale !== "zh") redirect(article.path);
  const structuredData = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: article.title, description: article.description, inLanguage: article.language,
    datePublished: `${article.date}T00:00:00+08:00`,
    author: { "@type": "Organization", name: article.author, url: "https://xopc.ai" },
    mainEntityOfPage: `https://xopc.ai${article.path}`, image: `https://xopc.ai${article.cover}`,
  };
  return <BlogShell locale="zh">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <article lang={article.language}>
      <header className="blog-article-header">
        <Link className="blog-back" href="/zh/blog">← 全部文章</Link>
        <p className="blog-eyebrow">INSIDE XOPC / {article.number} · {article.category}</p>
        <h1>{article.title}</h1>
        <p className="blog-intro">{article.description}</p>
        <div className="blog-meta"><span>{article.author}</span><time dateTime={article.date}>{blogDate(article.date)}</time><span>{article.readingTime}</span><span>中文首发</span></div>
      </header>
      <div className="blog-hero"><Image src={article.cover} alt={article.title} width={1200} height={630} priority /></div>
      <div className="blog-article-layout">
        <MarkdownArticle content={article.content} assetBase={article.assetBase} sections={article.sections} figures={article.figures} />
        <aside className="blog-toc" aria-label="文章目录">
          <p>本文内容</p>
          {article.sections.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}
          <a className="blog-download" href={article.assetBase + "/zh.md"} download>下载 Markdown ↓</a>
        </aside>
      </div>
    </article>
  </BlogShell>;
}
