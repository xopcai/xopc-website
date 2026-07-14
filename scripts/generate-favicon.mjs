/**
 * Sync website icons and brand SVGs from xopc/web/public.
 *
 * Keeping the pre-rendered image assets as the single source of truth avoids
 * SVG rasterization differences between local machines and CI.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const xopcRoot = path.resolve(root, "../xopc");
const sourcePublicDir = path.join(xopcRoot, "web", "public");

const assets = [
  // Next.js App Router file conventions.
  ["favicon.ico", "app/favicon.ico"],
  ["favicon.png", "app/icon.png"],
  ["apple-touch-icon.png", "app/apple-icon.png"],
  // Entries referenced by app/manifest.webmanifest.
  ["pwa-192x192.png", "public/pwa-192x192.png"],
  ["pwa-512x512.png", "public/pwa-512x512.png"],
  // Shared branding used by the landing page.
  ["logo.svg", "public/brand/logo.svg"],
  ["logo-dark.svg", "public/brand/logo-dark.svg"],
];

for (const [source] of assets) {
  const file = path.join(sourcePublicDir, source);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing icon or brand source: ${file}`);
  }
}

for (const [source, destination] of assets) {
  const output = path.join(root, destination);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(path.join(sourcePublicDir, source), output);
  console.log(`Synced ${destination}`);
}
