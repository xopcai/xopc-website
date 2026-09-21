import { cp, mkdir, readdir, readFile } from 'node:fs/promises';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

const root = new URL('../content/blog/', import.meta.url);
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = new URL(`${entry.name}/`, root);
  for (const file of await readdir(directory)) {
    if (!file.endsWith('.md')) continue;
    const { data, content } = matter(await readFile(new URL(file, directory), 'utf8'));
    if (data.slug !== entry.name || !data.title || !data.date) throw new Error(`Invalid blog metadata: ${entry.name}/${file}`);
    const tree = unified().use(remarkParse).parse(content);
    const images = [];
    function visit(node) {
      if (node.type === 'html') throw new Error(`Raw HTML is not supported in ${file}`);
      if (node.type === 'image' && node.url.startsWith('./')) images.push(node.url);
      for (const child of node.children ?? []) visit(child);
    }
    visit(tree);
    for (const image of images) await readFile(new URL(image, directory));
  }
  const published = new URL(`../public/blog/${entry.name}/`, import.meta.url);
  await mkdir(published, { recursive: true });
  await cp(directory, published, { recursive: true });
}
console.log('Blog Markdown and local image references verified; reading assets published.');
