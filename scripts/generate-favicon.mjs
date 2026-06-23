/**
 * Sync website brand assets from the main xopc web logo sources.
 * Sources:
 *   ../xopc/web/public/favicon.svg
 *   ../xopc/web/public/logo.svg
 *   ../xopc/web/public/logo-dark.svg
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const xopcRoot = path.resolve(root, "../xopc");

const sourceIcon = path.join(xopcRoot, "web/public/favicon.svg");
const sourceLogo = path.join(xopcRoot, "web/public/logo.svg");
const sourceLogoDark = path.join(xopcRoot, "web/public/logo-dark.svg");
const appDir = path.join(root, "app");
const brandDir = path.join(root, "public/brand");

for (const file of [sourceIcon, sourceLogo, sourceLogoDark]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing logo source: ${file}`);
  }
}

fs.mkdirSync(appDir, { recursive: true });
fs.mkdirSync(brandDir, { recursive: true });
fs.copyFileSync(sourceLogo, path.join(brandDir, "logo.svg"));
fs.copyFileSync(sourceLogoDark, path.join(brandDir, "logo-dark.svg"));

function renderPng(output, size) {
  execFileSync(
    "pnpm",
    ["dlx", "@resvg/resvg-js-cli", "--fit-width", String(size), sourceIcon, output],
    { stdio: "inherit" },
  );
}

const iconPng = path.join(appDir, "icon.png");
const appleIconPng = path.join(appDir, "apple-icon.png");
const faviconIco = path.join(appDir, "favicon.ico");

renderPng(iconPng, 1024);
renderPng(appleIconPng, 1024);

const buf = await pngToIco(iconPng);
fs.writeFileSync(faviconIco, buf);

console.log("Synced brand SVGs to", brandDir);
console.log("Wrote", iconPng);
console.log("Wrote", appleIconPng);
console.log("Wrote", faviconIco);
