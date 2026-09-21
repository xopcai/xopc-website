import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import matter from 'gray-matter';

const base = process.env.BLOG_BASE_URL ?? 'http://localhost:3000';
const root = new URL('../content/blog/', import.meta.url);
async function get(path) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(20_000) });
  assert.equal(response.status, 200, path);
  return response;
}
const index = await (await get('/zh/blog')).text();
const sitemap = await (await get('/sitemap.xml')).text();
let checked = 0;
for (const directory of await readdir(root, { withFileTypes: true })) {
  if (!directory.isDirectory()) continue;
  const source = await readFile(new URL(directory.name + '/zh.md', root), 'utf8');
  const { data } = matter(source);
  const route = '/zh/blog/' + data.slug;
  const html = await (await get(route)).text();
  assert(index.includes('href="' + route + '"'), 'Missing index entry: ' + route);
  assert(sitemap.includes('https://xopc.ai' + route), 'Missing sitemap entry: ' + route);
  assert(html.includes('<h1>' + data.title + '</h1>'), 'Wrong article title');
  assert(html.includes('rel="canonical" href="https://xopc.ai' + route + '"'), 'Wrong canonical');
  assert(html.includes('property="og:image" content="https://xopc.ai' + data.cover + '"'), 'Wrong social cover');
  const figures = JSON.parse(await readFile(new URL(directory.name + '/images/manifest.json', root), 'utf8'));
  assert.equal((html.match(/<figure>/g) ?? []).length, Object.keys(figures).length);
  assert.equal((html.match(/<figcaption>/g) ?? []).length, Object.keys(figures).length);
  for (const anchor of Object.values(data.anchors)) {
    assert(html.includes('id="' + anchor + '"'), 'Missing heading: ' + anchor);
    assert(html.includes('href="#' + anchor + '"'), 'Missing TOC link: ' + anchor);
  }
  assert.equal(await (await get('/blog/' + data.slug + '/zh.md')).text(), source);
  for (const name of Object.keys(figures)) {
    for (const suffix of ['', '-mobile', '-dark', '-mobile-dark']) {
      assert((await (await get('/blog/' + data.slug + '/images/' + name + suffix + '.svg')).text()).includes('<svg'));
    }
  }
  const english = await fetch(base + '/en/blog/' + data.slug, { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
  assert([307,308].includes(english.status), 'Untranslated route must redirect');
  assert.equal(new URL(english.headers.get('location'), base).pathname, route);
  checked++;
}
const missing = await fetch(base + '/zh/blog/not-a-published-article', { signal: AbortSignal.timeout(20_000) });
assert.equal(missing.status, 404);
console.log(`Verified ${checked} articles: titles, social covers, canonical URLs, sitemap, figures, TOCs, Markdown downloads, English redirects and 404 behavior.`);
