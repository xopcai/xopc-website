import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const catalog = await json('content/tutorials/catalog.json');
const map = await json('lib/product-map/manifest.json');
const nodes = new Set(map.nodes.map(node => node.id));
assert.equal(catalog.schemaVersion, 1);
const identities = new Set();
for (const tutorial of catalog.tutorials) {
  assert.match(tutorial.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.match(tutorial.revision, /^v[1-9][0-9]*$/);
  assert.ok(['zh-CN', 'en-US'].includes(tutorial.locale));
  const identity = `${tutorial.id}/${tutorial.locale}`;
  assert.ok(!identities.has(identity), `Duplicate tutorial: ${identity}`);
  identities.add(identity);
  assert.ok(tutorial.mapNodeIds.length > 0);
  for (const id of tutorial.mapNodeIds) assert.ok(nodes.has(id), `Unknown map node: ${id}`);
  const base = `/media/tutorials/${tutorial.id}/${tutorial.revision}/${tutorial.locale}`;
  const release = await json(`public${base}/release.json`);
  for (const key of ['id', 'revision', 'locale', 'durationSeconds', 'title', 'mapNodeIds', 'chapters']) {
    assert.deepEqual(tutorial[key], release[key], `${identity}: ${key} differs from release`);
  }
  for (const [key, filename] of Object.entries({video: 'video.mp4', poster: 'poster.jpg', captions: 'captions.vtt', article: 'article.json'})) {
    assert.equal(tutorial[key], `${base}/${filename}`);
    assert.ok(release.files[filename], `Missing ${filename}`);
  }
  if (tutorial.id.startsWith('scenario-')) {
    assert.equal(tutorial.kind, 'scenario');
    assert.equal(tutorial.materials, `${base}/materials.zip`);
    assert.ok(release.files['materials.zip']);
    assert.equal(release.kind, 'scenario');
  }
  for (const [name, record] of Object.entries(release.files)) {
    assert.match(name, /^(?:video\.mp4|poster\.jpg|captions\.vtt|article\.json|materials\.zip|images\/step-\d{2}\.png)$/);
    const file = path.join(root, `public${base}`, name);
    assert.equal((await stat(file)).size, record.bytes, `${identity}: size differs for ${name}`);
    const hash = createHash('sha256').update(await readFile(file)).digest('hex');
    assert.equal(hash, record.sha256, `${identity}: hash differs for ${name}`);
  }
  assert.ok(Number.isFinite(tutorial.durationSeconds) && tutorial.durationSeconds > 0);
  let previous = -1;
  for (const chapter of tutorial.chapters) {
    assert.ok(chapter.startSeconds > previous && chapter.startSeconds < tutorial.durationSeconds);
    previous = chapter.startSeconds;
  }
  const article = await json(`public${base}/article.json`);
  assert.equal(article.locale, tutorial.locale);
  assert.equal(article.steps.length, tutorial.chapters.length);
  for (const step of article.steps) assert.ok(release.files[step.image], `Unlisted step image: ${step.image}`);
  const captions = await readFile(path.join(root, `public${base}/captions.vtt`), 'utf8');
  assert.ok(captions.startsWith('WEBVTT\n'));
}
console.log(`Tutorials: ${catalog.tutorials.length} releases; map IDs, locales, chapters, assets and SHA-256 verified.`);
