import { readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { RootContent } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";

const source = readFileSync(path.join(process.cwd(), "content/blog/when-memory-changes/zh.md"), "utf8");
const { data, content } = matter(source);
function requiredString(key: string): string {
  const value: unknown = data[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing blog metadata: ${key}`);
  return value;
}
export const memoryArticle = {
  slug: requiredString("slug"),
  title: requiredString("title"),
  description: requiredString("description"),
  date: requiredString("date"),
  author: requiredString("author"),
  language: requiredString("language"),
  readingTime: requiredString("readingTime"),
  sourceRevision: requiredString("sourceRevision"),
  cover: requiredString("cover"),
};
export const memoryArticleContent = content;
export const memoryArticlePath = `/zh/blog/${memoryArticle.slug}`;
export const memoryArticleAssetBase = `/blog/${memoryArticle.slug}`;

function nodeText(node: RootContent): string {
  if ("value" in node) return node.value;
  if ("children" in node) return node.children.map(nodeText).join("");
  return "";
}
const anchors: unknown = data.anchors;
export const memoryArticleSections = unified().use(remarkParse).parse(content).children
  .filter((node) => node.type === "heading" && node.depth === 2)
  .map((node, index) => {
    const title = nodeText(node);
    const alias: unknown = anchors && typeof anchors === "object" ? (anchors as Record<string, unknown>)[title] : undefined;
    const id = typeof alias === "string" ? alias : `section-${index + 1}`;
    return [id, title] as const;
  });
