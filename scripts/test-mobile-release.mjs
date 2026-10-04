import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

// Exercise the real resolver in an isolated process-like context. No network or disk writes.
const source = readFileSync(new URL("../lib/github-mobile-release.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const release = { tag_name: "mobile-expo-v1.2.3", draft: false, assets: [{ name: "xopc-android.apk" }, { name: "xopc-android.apk.sha256" }] };
const epoch = 1_800_000_000_000;
function load({ disk = new Map(), fetcher = async () => ({ ok: false }), tag } = {}) {
  let now = epoch;
  let calls = 0;
  const exports = {};
  const io = {
    readFile: async file => { if (!disk.has(file)) throw Error("missing"); return disk.get(file); },
    mkdir: async () => {},
    writeFile: async (file, value) => { disk.set(file, value); },
    rename: async (from, to) => { disk.set(to, disk.get(from)); disk.delete(from); },
  };
  vm.runInNewContext(compiled, {
    exports, Date: class extends Date { static now() { return now; } }, AbortSignal,
    process: { cwd: () => "/test", pid: 1, env: { MOBILE_RELEASE_TAG: tag } },
    fetch: async (...args) => { calls++; return fetcher(...args); },
    require: id => {
      if (id === "server-only") return {};
      if (id === "node:fs/promises") return io;
      if (id === "node:path") return path;
      if (id === "@/lib/release-download-cache") return { GITHUB_REPO: "xopcai/xopc", githubApiHeaders: () => ({}) };
      throw Error(`Unexpected import: ${id}`);
    },
  });
  return { get: exports.fetchAndroidRelease, disk, calls: () => calls, advance: ms => { now += ms; } };
}

test("successful release persists and survives a restart plus GitHub rate limiting", async () => {
  const first = load({ fetcher: async () => ({ ok: true, json: async () => [release] }) });
  assert.equal((await first.get()).tag, release.tag_name);
  assert.equal(first.disk.size, 1);
  const restarted = load({ disk: first.disk });
  restarted.advance(120_000);
  assert.equal((await restarted.get()).checksumAsset.name, "xopc-android.apk.sha256");
  assert.equal(restarted.calls(), 1);
});

test("network exceptions use the verified snapshot, but expired snapshots do not", async () => {
  const first = load({ fetcher: async () => ({ ok: true, json: async () => [release] }) });
  await first.get();
  const offline = load({ disk: first.disk, fetcher: async () => { throw Error("offline"); } });
  offline.advance(120_000);
  assert.equal((await offline.get()).tag, release.tag_name);
  offline.advance(8 * 86_400_000);
  assert.equal(await offline.get(), null);
});

test("concurrent calls share one request; cold failures back off", async () => {
  const resolver = load();
  const values = await Promise.all(Array.from({ length: 8 }, () => resolver.get()));
  assert.ok(values.every(value => value === null));
  assert.equal(resolver.calls(), 1);
  await resolver.get();
  assert.equal(resolver.calls(), 1);
  resolver.advance(61_000);
  await resolver.get();
  assert.equal(resolver.calls(), 2);
});

test("a configured release never falls back to a different release", async () => {
  const first = load({ fetcher: async () => ({ ok: true, json: async () => [release] }) });
  await first.get();
  const pinned = load({ disk: first.disk, tag: "mobile-expo-v9.0.0" });
  assert.equal(await pinned.get(), null);
});

test("malformed, draft and missing-APK responses are not cached", async () => {
  for (const value of [null, {}, { ...release, assets: [null] }, { ...release, draft: true }, { ...release, assets: [] }]) {
    const resolver = load({ fetcher: async () => ({ ok: true, json: async () => [value] }) });
    assert.equal(await resolver.get(), null);
    assert.equal(resolver.disk.size, 0);
  }
});
