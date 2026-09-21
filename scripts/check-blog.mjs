import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import matter from 'gray-matter';

const base = process.env.BLOG_BASE_URL ?? 'http://localhost:3000';
const root = new URL('../content/blog/', import.meta.url);
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
async function get(path) {
  const response = await fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
  assert.equal(response.status, 200, path);
  return response;
}
const indexes = Object.fromEntries(await Promise.all(['zh','en'].map(async (locale) => [locale, await (await get('/' + locale + '/blog')).text()])));
const sitemap = await (await get('/sitemap.xml')).text();
let checked = 0;
for (const directory of await readdir(root, { withFileTypes: true })) {
  if (!directory.isDirectory()) continue;
  const versions = {};
  for (const locale of ['zh','en']) {
    const source = await readFile(new URL(directory.name + '/' + locale + '.md', root), 'utf8');
    const { data, content } = matter(source);
    versions[locale] = { data, content };
    const route = '/' + locale + '/blog/' + data.slug;
    const html = await (await get(route)).text();
    assert(indexes[locale].includes('href="' + route + '"'), 'Missing localized index entry: ' + route);
    assert(indexes[locale].includes(escape(data.title)), 'Index title is not localized: ' + route);
    assert(sitemap.includes('https://xopc.ai' + route), 'Missing sitemap entry: ' + route);
    assert(html.includes('<h1>' + escape(data.title) + '</h1>'), 'Wrong article title: ' + route);
    assert(html.includes('<article lang="' + data.language + '"'), 'Wrong article language');
    assert(html.includes('rel="canonical" href="https://xopc.ai' + route + '"'), 'Wrong canonical');
    assert(html.includes('property="og:image" content="https://xopc.ai' + data.cover + '"'), 'Wrong social cover');
    for (const other of ['zh','en']) {
      assert(html.includes('hrefLang="' + other + '" href="https://xopc.ai/' + other + '/blog/' + data.slug + '"'), 'Missing alternate: ' + other);
    }
    const other = locale === 'en' ? 'zh' : 'en';
    assert(html.includes('href="/' + other + '/blog/' + data.slug + '"'), 'Missing article language switch');
    assert(html.includes('Download Markdown') === (locale === 'en'), 'Wrong download label');
    const schemaMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    assert(schemaMatch, 'Missing structured data');
    const schema = JSON.parse(schemaMatch[1]);
    assert.equal(schema.inLanguage, data.language);
    assert.equal(schema.headline, data.title);
    assert.equal(schema.mainEntityOfPage, 'https://xopc.ai' + route);
    const cover = await get(data.cover);
    assert(cover.headers.get('content-type')?.includes('image/'), 'Missing cover image');
    const imageFolder = 'images/' + (locale === 'en' ? 'en/' : '');
    const figures = JSON.parse(await readFile(new URL(directory.name + '/' + imageFolder + 'manifest.json', root), 'utf8'));
    assert.equal((html.match(/<figure>/g) ?? []).length, Object.keys(figures).length);
    assert.equal((html.match(/<figcaption>/g) ?? []).length, Object.keys(figures).length);
    for (const anchor of Object.values(data.anchors)) {
      assert(html.includes('id="' + anchor + '"'), 'Missing heading: ' + anchor);
      assert(html.includes('href="#' + anchor + '"'), 'Missing TOC link: ' + anchor);
    }
    assert.equal(await (await get('/blog/' + data.slug + '/' + locale + '.md')).text(), source);
    for (const name of Object.keys(figures)) {
      for (const suffix of ['', '-mobile', '-dark', '-mobile-dark']) {
        const svg = await (await get('/blog/' + data.slug + '/' + imageFolder + name + suffix + '.svg')).text();
        assert(svg.includes('<svg'));
        if (locale === 'en') assert(!/[\u3400-\u9fff]/u.test(svg), 'Chinese label in English diagram');
      }
    }
    if (locale === 'en') {
      assert(!/[\u3400-\u9fff]/u.test(content), 'Chinese text in English Markdown');
      assert(!content.includes('](/zh/'), 'English content links to Chinese routes');
      for (const image of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) assert(image[1].startsWith('./images/en/'));
    }
    checked++;
  }
  assert.deepEqual(Object.values(versions.en.data.anchors).sort(), Object.values(versions.zh.data.anchors).sort(), 'Section IDs diverged');
  assert.equal(versions.en.data.sourceRevision, versions.zh.data.sourceRevision);
  const sources = (content) => [...new Set(content.match(/https:\/\/github.com\/xopcai\/xopc\/blob\/[^\s)]+/g))].sort();
  assert.deepEqual(sources(versions.en.content), sources(versions.zh.content), 'Implementation references diverged');
}
for (const locale of ['zh','en']) {
  const missing = await fetch(base + '/' + locale + '/blog/not-a-published-article', { signal: AbortSignal.timeout(20_000) });
  assert.equal(missing.status, 404);
}
console.log(`Verified ${checked} localized articles: direct 200 responses, content, localized covers and diagrams, metadata, reciprocal language links, sitemap, Markdown downloads, source parity and 404 behavior.`);
