import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function load(file, imports, globals = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: (name) => {
    assert.ok(name in imports, `Unexpected import: ${name}`);
    return imports[name];
  }, ...globals });
  return exports;
}

test("declarative downloads are recorded on a direct Ada visit and after navigation, with listener cleanup", () => {
  const events = [];
  const effects = [];
  const listeners = new Set();
  let pathname = "/zh/ada";
  const realEvents = load("lib/product-events.ts", {});
  class Element {
    constructor(dataset) { this.dataset = dataset; }
    closest() { return this; }
  }
  const analytics = load("components/site-analytics.tsx", {
    react: { useEffect: (callback, dependencies) => effects.push({ callback, dependencies }) },
    "next/navigation": { usePathname: () => pathname },
    "@/lib/product-events": {
      isProductEventName: realEvents.isProductEventName,
      trackProductEvent: (name, dimensions) => events.push({ name, dimensions, pathname }),
    },
  }, { Element, document: {
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  } });
  const click = (name) => listeners.forEach((listener) => listener({ target: new Element({ productEvent: name, productMethod: "test" }) }));

  analytics.SiteAnalytics();
  effects[0].callback();
  const cleanup = effects[1].callback();
  click("ada_download_clicked");
  pathname = "/zh";
  click("hero_download_clicked");
  click("nav_download_clicked");
  click("unknown_event");
  assert.deepEqual(events.map((item) => item.name), ["page_viewed", "ada_download_clicked", "hero_download_clicked", "nav_download_clicked"]);
  assert.equal(events[1].pathname, "/zh/ada");
  assert.equal(events[2].pathname, "/zh");
  cleanup();
  assert.equal(listeners.size, 0);
  // React development remounts must not leave duplicate listeners behind.
  const cleanupAgain = effects[1].callback();
  click("ada_download_clicked");
  assert.equal(events.filter((item) => item.name === "ada_download_clicked").length, 2);
  cleanupAgain();
});

test("film playback is counted once; a seek to the end is not a complete viewing", () => {
  const events = [];
  const { createFilmAnalytics } = load("lib/film-analytics.ts", {
    "@/lib/product-events": { trackProductEvent: (name, dimensions) => events.push({ name, dimensions }) },
  });
  const viewing = createFilmAnalytics("work-overview");
  const video = (ranges, duration = 100) => ({ duration, played: { length: ranges.length, start: (i) => ranges[i][0], end: (i) => ranges[i][1] } });
  viewing.ended(video([[0, 100]]));
  assert.equal(events.length, 0);
  viewing.started();
  viewing.started();
  viewing.ended(video([[0, 4], [98, 100]]));
  viewing.ended(video([[0, 100]], Infinity));
  assert.deepEqual(events.map((event) => event.name), ["film_started"]);
  viewing.ended(video([[0, 45], [50, 100]]));
  viewing.ended(video([[0, 100]]));
  assert.deepEqual(events.map((event) => event.name), ["film_started", "film_completed"]);
  assert.equal(events[1].dimensions.method, "work-overview");
  createFilmAnalytics("ada-home").started();
  assert.equal(events[2].dimensions.method, "ada-home");
});

test("the events API accepts Ada and film events without dropping their entry attribution", async () => {
  const events = [];
  const realEvents = load("lib/product-events.ts", {});
  const { POST } = load("app/api/events/route.ts", {
    "@/lib/product-events": realEvents,
    "@/lib/request-rate-limit": { requestIp: () => "test", takeRateLimit: () => ({ allowed: true }) },
    "@/lib/site-database.server": { recordProductEvent: (event) => events.push(event) },
  }, { Response, TextEncoder, Date });
  for (const name of ["ada_download_clicked", "film_opened", "film_started", "film_completed"]) {
    const request = new Request("http://localhost/api/events", { method: "POST", headers: { "sec-fetch-site": "same-origin" }, body: JSON.stringify({
      event: name, eventId: crypto.randomUUID(), sessionId: crypto.randomUUID(), path: "/en/ada", locale: "en", method: "ada-home",
    }) });
    assert.equal((await POST(request)).status, 204);
  }
  assert.equal(events.length, 4);
  assert.ok(events.every((event) => event.method === "ada-home" && event.path === "/en/ada" && event.locale === "en"));
});

test("download probes and failed requests do not inflate download-start counts", async () => {
  const events = [];
  let status = 307;
  const { GET } = load("app/api/download/release/route.ts", {
    "@/lib/release-download-cache": {
      assertAllowedReleaseTag: () => {}, assertAllowedReleaseAssetName: () => {},
      serveCachedReleaseDownload: async () => new Response(null, { status }),
    },
    "@/lib/download-event.server": { downloadEventDimensions: () => ({ platform: "android", version: "test" }) },
    "@/lib/distribution-config.server": { releasePublicBaseUrl: () => null },
    "@/lib/site-database.server": { recordProductEvent: event => events.push(event) },
  }, { URL, Response });
  const url = "http://localhost/api/download/release?tag=test&name=xopc-android.apk&locale=en";
  await GET(new Request(url, { method: "HEAD" }));
  assert.equal(events.length, 0);
  status = 404;
  await GET(new Request(url));
  assert.equal(events.length, 0);
  status = 307;
  await GET(new Request(url));
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "download_started");
  assert.equal(events[0].locale, "en");
});

test("browser events retain locale, attribution and the actual user-agent device type", async () => {
  for (const [userAgent, expectedDevice, lang] of [
    ["Mozilla/5.0 (Linux; Android 15) Mobile", "mobile", "zh-CN"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18)", "mobile", "en"],
    ["Mozilla/5.0 (iPad; CPU OS 18)", "tablet", "en"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X)", "desktop", "en"],
  ]) {
    const storage = new Map();
    let payload;
    const events = load("lib/product-events.ts", {}, {
      window: { location: { pathname: "/en/ada", hostname: "localhost", search: "?utm_source=qa-test" } },
      document: { documentElement: { lang }, referrer: "" },
      navigator: { userAgent, maxTouchPoints: 0, sendBeacon: (_, body) => { payload = body; return true; } },
      sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
      crypto, Blob, URLSearchParams, URL,
    });
    events.trackProductEvent("nav_download_clicked", { method: "mobile-menu" });
    const received = JSON.parse(await payload.text());
    assert.equal(received.deviceType, expectedDevice);
    assert.equal(received.locale, lang === "en" ? "en" : "zh");
    assert.equal(received.method, "mobile-menu");
    assert.equal(received.utmSource, "qa-test");
    assert.equal(received.path, "/en/ada");
  }
});
