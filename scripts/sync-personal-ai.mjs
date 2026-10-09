import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/sync-personal-ai.mjs <delivery/version-directory>");
const manifest = JSON.parse(await readFile(path.join(source, "manifest.json"), "utf8"));
if (manifest.id !== "personal-ai" || !/^v\d+$/.test(manifest.version)) throw new Error("Invalid Personal AI release");
const base = `/media/product/personal-ai/${manifest.version}`;
const content = { version: manifest.version, base, locales: {} };
const staged = [];

for (const [locale, language] of [["zh", "zh-CN"], ["en", "en-US"]]) {
  const release = JSON.parse(await readFile(path.join(source, language, "release.json"), "utf8"));
  if (release.id !== manifest.id || release.version !== manifest.version || release.locale !== language) throw new Error(`Release mismatch: ${language}`);
  if (!(release.durationSeconds > 0) || !Array.isArray(release.chapters) || release.chapters.length !== 6) throw new Error(`Invalid chapters: ${language}`);
  for (const name of ["video.mp4", "poster.jpg", "captions.vtt"]) {
    const bytes = await readFile(path.join(source, language, name));
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hash !== release.files[name]?.sha256 || bytes.length !== release.files[name]?.bytes) throw new Error(`Integrity failure: ${language}/${name}`);
    const target = path.join("public", base, language, name);
    const existing = await readFile(target).catch(error => { if (error.code === "ENOENT") return null; throw error; });
    if (existing && !existing.equals(bytes)) throw new Error(`Published asset is immutable; create a new version: ${target}`);
    staged.push({ target, bytes });
  }
  content.locales[locale] = release;
}
for (const { target, bytes } of staged) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}
await mkdir("content/personal-ai", { recursive: true });
await writeFile("content/personal-ai/manifest.json", JSON.stringify(content, null, 2) + "\n");
console.log(`Personal AI ${manifest.version}: both locales verified and synchronized`);
