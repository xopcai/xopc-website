import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsx from "react/jsx-runtime";
import ts from "typescript";

function load(file, imports) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: id => {
    assert.ok(id in imports, `Unexpected import: ${id}`);
    return imports[id];
  } });
  return exports;
}
const { assetPickers } = load("lib/release-assets.ts", {});
function resolver(assets) {
  return load("lib/download-resolver.server.ts", {
    "server-only": {},
    "@/lib/distribution-config.server": {},
    "@/lib/github-mobile-release": {},
    "@/lib/release-assets": { assetPickers },
    "@/lib/release-download-cache": { fetchDesktopRelease: async () => ({ tag: "v1.2.3", assets }) },
  }).resolveDownload;
}

test("a partial release never reports an empty platform as available", async () => {
  const resolve = resolver([{ name: "xopc-1.2.3-x86_64.AppImage", url: "https://example.com/linux" }]);
  for (const platform of ["macos", "windows"]) {
    const result = await resolve(platform, "zh");
    assert.equal(result.ok, false);
    assert.equal(result.reason, "assets-pending");
  }
  const linux = await resolve("linux", "en");
  assert.equal(linux.ok, true);
  assert.equal(linux.assets.length, 1);
  assert.match(linux.assets[0].url, /locale=en$/);
  assert.match(linux.assets[0].url, /tag=v1.2.3/);
});

test("each platform resolves its matching assets and preserves locale attribution", async () => {
  const resolve = resolver(["arm64.dmg", "x64.dmg", "x64.exe", "arm64.exe", "x86_64.AppImage", "amd64.deb", "arm64.AppImage"].map(suffix => ({ name: `xopc-1.2.3-${suffix}`, url: "https://example.com/file" })));
  for (const [platform, count] of [["macos", 2], ["windows", 2], ["linux", 3]]) {
    const result = await resolve(platform, "zh");
    assert.equal(result.ok, true);
    assert.equal(result.assets.length, count);
    assert.ok(result.assets.every(asset => asset.url.endsWith("locale=zh")));
  }
});

test("loading, upstream failure and missing installers preserve the platform selector and recovery controls", () => {
  const messages = JSON.parse(readFileSync(new URL("../messages/zh.json", import.meta.url))).landing.download;
  for (const payload of [null, { ok: false, platform: "macos", status: "unavailable" }, { ok: false, platform: "macos", status: "unavailable", reason: "assets-pending" }]) {
    const states = [payload, "unknown", 0];
    const { DesktopDownloadPicker } = load("components/desktop-download-picker.tsx", {
      react: { useState: () => [states.shift(), () => {}], useEffect: () => {}, useMemo: fn => fn() },
      "react/jsx-runtime": jsx,
      "lucide-react": { Download: () => null, ExternalLink: () => null },
      "@/lib/client-platform": { detectOsSync: () => "macos" },
      "@/lib/release-assets": { assetPickers },
      "@/lib/downloads": { RELEASES_INDEX_URL: "https://github.com/xopcai/xopc/releases" },
      "@/lib/product-events": {},
    });
    const markup = renderToStaticMarkup(DesktopDownloadPicker({ d: messages, platform: "macos", platformSelector: createElement("button", null, "Switch platform") }));
    assert.match(markup, /Switch platform/);
    assert.match(markup, /id="desktop-download-options"/);
    if (payload) {
      assert.match(markup, /重新尝试/);
      assert.match(markup, /github.com\/xopcai\/xopc\/releases/);
      if (payload.reason) assert.match(markup, /macOS 安装包暂未就绪/);
    }
  }
});
