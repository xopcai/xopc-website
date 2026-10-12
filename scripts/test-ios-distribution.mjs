import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function load(env = {}) {
  const modules = {};
  function requireModule(id) {
    if (id === "server-only") return {};
    if (id === "@/lib/github-mobile-release") return { fetchAndroidRelease: async () => { throw Error("unexpected Android lookup"); } };
    if (id === "@/lib/release-download-cache") return { fetchDesktopRelease: async () => { throw Error("unexpected desktop lookup"); } };
    if (id === "@/lib/release-assets") return {};
    if (modules[id]) return modules[id];
    const file = id.replace("@/", "../") + ".ts";
    const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const exports = {};
    vm.runInNewContext(compiled, { exports, require: requireModule, process: { env }, URL });
    modules[id] = exports;
    return exports;
  }
  return requireModule("@/lib/download-resolver.server").resolveDownload;
}

test("the default iOS download resolves to the public TestFlight invitation in both locales", async () => {
  const resolve = load();
  for (const locale of ["zh", "en"]) {
    const result = await resolve("ios", locale);
    assert.equal(result.status, "available");
    assert.equal(result.channel, "ios-testflight");
    assert.equal(result.assets[0].url, "https://testflight.apple.com/join/mGu7DU1T");
    assert.equal(result.acceptingSignups, undefined);
  }
});

test("explicit accepting and paused settings retain the signup controls", async () => {
  for (const status of ["accepting", "paused"]) {
    const result = await load({ IOS_DISTRIBUTION_STATUS: status })("ios", "zh");
    assert.equal(result.status, "testflight");
    assert.equal(result.acceptingSignups, status === "accepting");
  }
});

test("public and App Store overrides use the configured URL and channel", async () => {
  for (const status of ["public", "released"]) {
    const url = status === "public" ? "https://testflight.apple.com/join/custom" : "https://apps.apple.com/app/custom";
    const result = await load({ IOS_DISTRIBUTION_STATUS: status, IOS_DISTRIBUTION_URL: url })("ios", "en");
    assert.equal(result.status, "available");
    assert.equal(result.assets[0].url, url);
    assert.equal(result.channel, status === "public" ? "ios-testflight" : "ios-app-store");
  }
});

test("invalid distribution configuration remains paused", async () => {
  for (const env of [
    { IOS_DISTRIBUTION_STATUS: "public" },
    { IOS_DISTRIBUTION_STATUS: "released", IOS_DISTRIBUTION_URL: "http://example.com" },
    { IOS_DISTRIBUTION_STATUS: "unknown" },
  ]) {
    const result = await load(env)("ios", "zh");
    assert.equal(result.status, "testflight");
    assert.equal(result.acceptingSignups, false);
  }
});
