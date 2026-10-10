import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/sync-ada-previews.mjs <personal-agent-film-source>");
const base = "/media/product/ada/previews/v1";
const content = { version: "v1", base, locales: {} };
for (const [locale, language] of [["zh", "zh-CN"], ["en", "en-US"]]) {
  const images = {};
  for (const name of ["context", "discussion", "delegate", "revision"]) {
    const original = await readFile(path.join(source, language, "assets/images", `${name}.png`));
    const bytes = await sharp(original).webp({ quality: 92 }).toBuffer();
    const { width, height } = await sharp(bytes).metadata();
    const src = `${base}/${language}/${name}.webp`;
    const target = path.join("public", src);
    const existing = await readFile(target).catch(error => { if (error.code === "ENOENT") return null; throw error; });
    if (existing && !existing.equals(bytes)) throw new Error(`Immutable preview: ${target}`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    images[name] = { src, width, height, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), sourceSha256: createHash("sha256").update(original).digest("hex") };
  }
  content.locales[locale] = images;
}
await mkdir("content/ada", { recursive: true });
await writeFile("content/ada/previews.json", JSON.stringify(content, null, 2) + "\n");
console.log("Eight Ada previews synchronized from actual bilingual xopc captures");
