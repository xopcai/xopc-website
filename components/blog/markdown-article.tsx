import Image from "next/image";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Root } from "mdast";
import type { Plugin } from "unified";
import figures from "@/content/blog/when-memory-changes/images/manifest.json";

type Props = {
  content: string;
  assetBase: string;
  sections: readonly (readonly [string, string])[];
};

/** A standalone image followed by an italic paragraph becomes a captioned figure. */
const remarkFigures: Plugin<[], Root> = () => (tree) => {
  for (let index = 0; index < tree.children.length; index++) {
    const node = tree.children[index];
    const next = tree.children[index + 1];
    if (node.type !== "paragraph" || node.children.length !== 1 || node.children[0].type !== "image") continue;
    node.data = { ...node.data, hName: "figure" };
    if (next?.type === "paragraph" && next.children.length === 1 && next.children[0].type === "emphasis") {
      const caption = next.children[0];
      caption.data = { ...caption.data, hName: "figcaption" };
      node.children.push(caption);
      tree.children.splice(index + 1, 1);
    }
  }
};

export function MarkdownArticle({ content, assetBase, sections }: Props) {
  const remarkHeadings: Plugin<[], Root> = () => (tree) => {
    let index = 0;
    for (const node of tree.children) {
      if (node.type !== "heading" || node.depth !== 2) continue;
      node.data = { ...node.data, hProperties: { id: sections[index++]?.[0] } };
    }
  };
  return <div className="blog-prose">
    <Markdown skipHtml remarkPlugins={[remarkGfm, remarkFigures, remarkHeadings]} components={{
      table: ({ children }) => <div className="blog-table-wrap" tabIndex={0} role="region" aria-label="文章表格，可横向滚动"><table>{children}</table></div>,
      img: ({ src, alt }) => {
        if (typeof src !== "string") return null;
        const name = src.match(/^\.\/images\/([a-z-]+)\.svg$/)?.[1];
        const size = name && Object.hasOwn(figures, name) ? figures[name as keyof typeof figures] : undefined;
        const resolved = src.startsWith("./") ? `${assetBase}/${src.slice(2)}` : src;
        if (!size || !name) return <Image src={resolved} alt={alt ?? ""} width={1200} height={630} unoptimized />;
        return <a className="article-figure-link" href={resolved} target="_blank" rel="noopener noreferrer" aria-label={`查看大图：${alt ?? "文章配图"}`}>
          {(["light", "dark"] as const).map((theme) => {
            const suffix = theme === "dark" ? "-dark" : "";
            return <picture key={theme} className={`article-picture article-picture-${theme}`}>
              <source media="(max-width: 600px)" srcSet={`${assetBase}/images/${name}-mobile${suffix}.svg`} width={size.mobileWidth} height={size.mobileHeight} />
              <Image src={`${assetBase}/images/${name}${suffix}.svg`} alt={alt ?? ""} width={size.width} height={size.height} unoptimized />
            </picture>;
          })}
          <span className="figure-open">查看大图 ↗</span>
        </a>;
      },
    }}>{content}</Markdown>
  </div>;
}
