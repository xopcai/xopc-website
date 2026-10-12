import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, imports = {}, globals = {}) {
  const exports = {};
  const compiled = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports, Request, Response, TextEncoder, AbortSignal, console, process,
    require: id => id in imports ? imports[id] : require(id), ...globals,
  });
  return exports;
}
const validation = load("lib/beta-signup-validation.ts");
function setup({ ios = "accepting", notify = async () => true, allowed = true } = {}) {
  // Real schema and deduplication against an in-memory SQLite database.
  const Database = require("better-sqlite3");
  class MemoryDatabase extends Database { constructor() { super(":memory:"); } }
  const db = load("lib/site-database.server.ts", {
    "server-only": {}, "better-sqlite3": MemoryDatabase,
  }, { process: { env: {}, cwd: () => "/test" }, require: id => {
    if (id === "node:fs") return { mkdirSync() {} };
    if (id === "server-only") return {};
    if (id === "better-sqlite3") return MemoryDatabase;
    return require(id);
  } });
  const notices = [];
  const route = load("app/api/beta-signups/route.ts", {
    "@/lib/site-database.server": db,
    "@/lib/beta-signup-validation": validation,
    "@/lib/request-rate-limit": { requestIp: () => "test", takeRateLimit: () => ({ allowed, retryAfterSeconds: 600 }) },
    "@/lib/distribution-config.server": { iosDistribution: () => ({ status: ios }) },
    "@/lib/telegram-beta-notify": {
      notifyHarmonyBetaSignup: async phone => { notices.push(phone); return notify(phone); },
      notifyIosBetaSignup: async email => { notices.push(email); },
    },
  });
  return {
    db, notices,
    post: body => route.POST(new Request("https://xopc.ai/api/beta-signups", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })),
  };
}
const signup = { program: "harmony-invited-test", phone: "13800138000", locale: "zh", source: "landing" };

test("normalizes mainland phone numbers and rejects malformed or foreign numbers", () => {
  for (const number of ["13800138000", "+86 138 0013 8000", "0086 (138) 0013-8000"]) {
    assert.equal(validation.normalizeHarmonyPhone(number), signup.phone);
  }
  for (const number of [null, 13800138000, "12800138000", "1380013800", "+1 2025550100", "13800138000abc"]) {
    assert.equal(validation.normalizeHarmonyPhone(number), null);
  }
});

test("saves a HarmonyOS request and notifies once, independently of iOS availability", async () => {
  const s = setup({ ios: "paused" });
  assert.equal((await s.post(signup)).status, 201);
  assert.equal((await s.post({ ...signup, phone: "+86 13800138000" })).status, 200);
  assert.deepEqual(s.notices, [signup.phone]);
  assert.equal(s.db.getSiteDatabase().prepare("SELECT COUNT(*) AS n FROM harmony_beta_signups").get().n, 1);
  assert.equal(s.db.getSiteDatabase().prepare("SELECT COUNT(*) AS n FROM product_events").get().n, 1);
});

test("failed Telegram delivery preserves the request and retries on resubmission", async () => {
  let success = false;
  const s = setup({ notify: async () => success });
  assert.equal((await s.post(signup)).status, 503);
  assert.equal(s.db.getSiteDatabase().prepare("SELECT notified_at FROM harmony_beta_signups").get().notified_at, null);
  success = true;
  assert.equal((await s.post(signup)).status, 200);
  assert.equal(s.notices.length, 2);
  assert.ok(s.db.getSiteDatabase().prepare("SELECT notified_at FROM harmony_beta_signups").get().notified_at);
});

test("concurrent double submissions share one notification", async () => {
  const s = setup();
  const responses = await Promise.all([s.post(signup), s.post(signup)]);
  assert.ok(responses.every(response => response.ok));
  assert.equal(s.notices.length, 1);
  assert.equal(s.db.getSiteDatabase().prepare("SELECT COUNT(*) AS n FROM product_events").get().n, 1);
});

test("invalid requests, honeypots and rate limits never notify", async () => {
  const s = setup();
  assert.equal((await s.post({ ...signup, phone: "bad" })).status, 400);
  assert.equal((await s.post({ ...signup, program: "unknown" })).status, 400);
  assert.equal((await s.post({ ...signup, company: "spam" })).status, 200);
  assert.equal((await s.post({ ...signup, extra: "x".repeat(3000) })).status, 413);
  assert.equal(s.notices.length, 0);
  const limited = setup({ allowed: false });
  const response = await limited.post(signup);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "600");
  assert.equal(limited.notices.length, 0);
});

test("existing iOS signup and paused behavior still work", async () => {
  const body = { program: "ios-testflight", email: " USER@example.com ", locale: "en" };
  const s = setup();
  assert.equal((await s.post(body)).status, 201);
  assert.equal((await s.post(body)).status, 200);
  assert.deepEqual(s.notices, ["user@example.com"]);
  assert.equal((await setup({ ios: "paused" }).post(body)).status, 409);
});

test("Telegram payload identifies HarmonyOS and handles API failures without leaking credentials", async () => {
  const env = { TELEGRAM_BOT_TOKEN: "test-token", TELEGRAM_CHAT_ID: "test-chat" };
  let payload;
  const mod = load("lib/telegram-beta-notify.ts", {}, {
    process: { env }, fetch: async (_url, options) => {
      payload = JSON.parse(options.body);
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });
  assert.equal(await mod.notifyHarmonyBetaSignup(signup.phone), true);
  assert.equal(payload.chat_id, "test-chat");
  assert.match(payload.text, /鸿蒙/);
  assert.ok(payload.text.includes(signup.phone));
  const bad = load("lib/telegram-beta-notify.ts", {}, {
    process: { env }, console: { error() {} }, fetch: async () => ({ ok: true, json: async () => ({ ok: false }) }),
  });
  assert.equal(await bad.notifyHarmonyBetaSignup(signup.phone), false);
  const missing = load("lib/telegram-beta-notify.ts", {}, { process: { env: {} } });
  assert.equal(await missing.notifyHarmonyBetaSignup(signup.phone), false);
});
