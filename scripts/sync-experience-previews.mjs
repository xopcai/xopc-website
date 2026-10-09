import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceRoot = path.resolve(process.argv[2] ?? "../xopc-tutorials");
const base = "/media/product/experiences/v2";
const entries = [];
for (const [locale, language] of [["zh", "zh-CN"], ["en", "en-US"]]) {
  entries.push([`personal-${locale}`, `xopc-personal-agent-intro/${language}/assets/images/context.png`, `${language}/personal-context.webp`, 1740]);
  for (const [id, image] of [["slides", "chart"], ["spreadsheet", "spreadsheet"], ["revision", "revision"]]) {
    entries.push([`${id}-${locale}`, `xopc-work-intro/${language}/assets/images/${image}.png`, `${language}/${id}.webp`, 1740]);
  }
}
const manifest = { version: "v2", base, captures: {} };
for (const [id, source, output, width] of entries) {
  const bytes = await sharp(path.join(sourceRoot, "videos", source)).resize({ width, withoutEnlargement: true }).webp({ quality: 92 }).toBuffer();
  const metadata = await sharp(bytes).metadata();
  const destination = path.join("public", base, output);
  const previous = await readFile(destination).catch(error => { if (error.code === "ENOENT") return null; throw error; });
  if (previous && !previous.equals(bytes)) throw new Error(`Published preview differs: ${output}. Create a new version instead.`);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  manifest.captures[id] = { source: `videos/${source}`, src: `${base}/${output}`, width: metadata.width, height: metadata.height, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}
await mkdir("content/marketing", { recursive: true });
await writeFile("content/marketing/experience-previews.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Synced ${entries.length} reviewed previews with separate Chinese and English artifacts.`);
