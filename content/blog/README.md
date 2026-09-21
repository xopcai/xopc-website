# Writing Inside xopc

Each article keeps its content and illustrations together:

    <slug>/
      zh.md
      en.md                 # Add only when a translation is ready.
      images/
        <figure>.svg        # Editable, portable desktop illustration.
        <figure>.png        # 2× export for republishing.
        <figure>-mobile.svg
        <figure>-dark.svg
        <figure>-mobile-dark.svg
        manifest.json       # Intrinsic dimensions for responsive rendering.

Write paragraphs, headings, lists, fenced code and GFM tables in Markdown.
Do not embed HTML or React components. Frontmatter holds title, description,
date, author, language, readingTime, number, category, cover, sourceRevision and stable heading
anchors. Preserve anchors when changing headings so existing links keep working.

Use ordinary relative image links with descriptive alt text. An italic paragraph
immediately after a standalone image becomes its caption on the website:

    ![Describe the relationship the reader should understand.](./images/example.svg)

    *Figure 1 · Explain the illustration and any simplifying assumptions.*

Keep diagrams focused on one idea. Use separate mobile layouts when shrinking a
desktop diagram would make its labels unreadable. Include assumptions and scope
in the caption; technical claims should match the pinned source revision.

The first article's drawings are generated from
`scripts/generate-blog-figures.mjs`; articles 02 and 03 use
`scripts/generate-engineering-figures.mjs`. Run `pnpm blog:figures` after changing them.
The SVG files are the editable vector assets; PNG exports use locally installed
CJK fonts (PingFang SC, Microsoft YaHei or Noto Sans CJK SC).

`pnpm blog:prepare` validates metadata, rejects raw HTML, checks image references,
and copies article folders to ignored `public/blog/`. Both dev and build run it.
Rerun it after editing image assets during an existing dev session.
The published Markdown and image directory retain their relative paths.
Download both when using the article outside the website.

Shared typography, captions, tables and responsive images belong in
`components/blog/markdown-article.tsx` and the blog stylesheet. The article remains
readable in a normal Markdown viewer without those website enhancements.

For a new article, add its slug to the published registry in `lib/blog.ts`.
The index, static params, metadata and sitemap all read that registry.
Add an image manifest with desktop/mobile dimensions for every responsive figure.
Do not advertise an English article URL until its translated content exists.

With a dev or production server running, use
`BLOG_BASE_URL=http://localhost:3000 pnpm blog:check` to verify article routing,
metadata, sitemap, figure variants, Markdown downloads and language redirects.
