import { readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { RootContent } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { locales, type Locale } from "@/lib/i18n/config";

export type BlogFigure = { width: number; height: number; mobileWidth: number; mobileHeight: number };
export type BlogArticle = {
  locale: Locale; slug: string; title: string; description: string; date: string; author: string;
  language: string; readingTime: string; number: string; category: string;
  cover: string; content: string; path: string; assetBase: string;
  sections: readonly (readonly [string, string])[];
  figures: Record<string, BlogFigure>;
};

function nodeText(node: RootContent): string {
  if ("value" in node) return node.value;
  if ("children" in node) return node.children.map(nodeText).join("");
  return "";
}

function readArticle(slug: string, locale: Locale): BlogArticle {
  const directory = path.join(process.cwd(), "content/blog", slug);
  const { data, content } = matter(readFileSync(path.join(directory, `${locale}.md`), "utf8"));
  function field(key: string): string {
    const value: unknown = data[key];
    if (typeof value !== "string" || !value.trim()) throw new Error(`Missing blog metadata: ${slug}/${key}`);
    return value;
  }
  if (field("slug") !== slug) throw new Error(`Blog slug mismatch: ${slug}`);
  const sections = unified().use(remarkParse).parse(content).children
    .filter((node) => node.type === "heading" && node.depth === 2)
    .map((node, index) => {
      const title = nodeText(node);
      const alias: unknown = data.anchors?.[title];
      return [typeof alias === "string" ? alias : `section-${index + 1}`, title] as const;
    });
  return {
    locale, slug, title: field("title"), description: field("description"), date: field("date"),
    author: field("author"), language: field("language"), readingTime: field("readingTime"),
    number: field("number"), category: field("category"),
    cover: field("cover"), content, path: `/${locale}/blog/${slug}`, assetBase: `/blog/${slug}`,
    sections, figures: JSON.parse(readFileSync(path.join(directory, locale === "en" ? "images/en/manifest.json" : "images/manifest.json"), "utf8")),
  };
}

// Only reviewed, published articles belong in this registry.
const blogSlugs = ["what-an-approval-allows", "history-is-not-context", "when-memory-changes"];
export const blogArticles = locales.flatMap((locale) => blogSlugs.map((slug) => readArticle(slug, locale)));
export function getBlogArticles(locale: Locale): BlogArticle[] {
  return blogArticles.filter((article) => article.locale === locale);
}
export function getBlogArticle(slug: string, locale: Locale): BlogArticle | undefined {
  return blogArticles.find((article) => article.slug === slug && article.locale === locale);
}
export function blogAlternates(slug: string) {
  return { zh: `/zh/blog/${slug}`, en: `/en/blog/${slug}`, "x-default": `/en/blog/${slug}` };
}
export function blogDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(date));
}
