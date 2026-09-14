import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const [manifest, zh, en] = await Promise.all([
  read('../lib/product-map/manifest.json'),
  read('../messages/product-map/zh.json'),
  read('../messages/product-map/en.json'),
]);

function compareTranslations(left, right, path = 'productMap') {
  assert.equal(typeof right, typeof left, `${path}: type mismatch`);
  if (typeof left === 'string') {
    assert.ok(right.trim(), `${path}: missing English text`);
    assert.ok(!/[\u3400-\u9fff]/u.test(right), `${path}: untranslated Chinese text`);
    const placeholders = text => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();
    assert.deepEqual(placeholders(left), placeholders(right), `${path}: placeholder mismatch`);
  } else if (Array.isArray(left)) {
    assert.equal(right.length, left.length, `${path}: item count mismatch`);
    left.forEach((item, index) => compareTranslations(item, right[index], `${path}.${index}`));
  } else {
    assert.deepEqual(Object.keys(right).sort(), Object.keys(left).sort(), `${path}: translation keys differ`);
    for (const key of Object.keys(left)) compareTranslations(left[key], right[key], `${path}.${key}`);
  }
}
compareTranslations(zh, en);
const ids = new Set(manifest.nodes.map(node => node.id));
assert.equal(ids.size, manifest.nodes.length, 'Duplicate feature IDs');
assert.deepEqual(Object.keys(zh.nodes).sort(), [...ids].sort(), 'Feature translations do not match the manifest');
const grouped = manifest.groups.flatMap(group => group.ids);
assert.deepEqual(grouped.toSorted(), [...ids].sort(), 'Each feature must belong to exactly one group');
assert.deepEqual(Object.keys(zh.groups).sort(), manifest.groups.map(group => group.id).sort());
assert.deepEqual(Object.keys(zh.journeys).sort(), manifest.journeys.map(journey => journey.id).sort());
for (const node of manifest.nodes) {
  assert.ok(manifest.groups.find(group => group.id === node.group)?.ids.includes(node.id), `Invalid parent for ${node.id}`);
  for (const related of node.related) assert.ok(ids.has(related), `Broken relation: ${node.id} → ${related}`);
  assert.ok(['available', 'experimental', 'evolving'].includes(node.status));
}
for (const journey of manifest.journeys) for (const id of journey.ids) assert.ok(ids.has(id), `Broken journey: ${id}`);
assert.equal(manifest.layers.length, zh.layers.length);
for (const layer of manifest.layers) for (const id of layer) assert.ok(ids.has(id), `Broken architecture node: ${id}`);
console.log(`Product map: ${ids.size} features, ${manifest.groups.length} groups and ${manifest.journeys.length} journeys; bilingual keys, placeholders and references verified.`);
