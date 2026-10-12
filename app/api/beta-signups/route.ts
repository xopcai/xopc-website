import { requestIp, takeRateLimit } from "@/lib/request-rate-limit";
import { createHarmonyBetaSignup, markHarmonyBetaSignupNotified, createIosBetaSignup, recordProductEvent, type SiteLocale } from "@/lib/site-database.server";
import { notifyIosBetaSignup, notifyHarmonyBetaSignup } from "@/lib/telegram-beta-notify";
import { normalizeHarmonyPhone } from "@/lib/beta-signup-validation";
import { iosDistribution } from "@/lib/distribution-config.server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 2_048;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCE_PATTERN = /^[a-z0-9-]{1,32}$/;

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

// Coalesce double submits while Telegram is responding in this server process.
const harmonyNotifications = new Map<string, Promise<boolean>>();

async function deliverHarmonySignup(phone: string, locale: SiteLocale, source: string): Promise<boolean> {
  const pending = harmonyNotifications.get(phone);
  if (pending) return pending;
  const delivery = (async () => {
    if (!await notifyHarmonyBetaSignup(phone)) return false;
    markHarmonyBetaSignupNotified(phone);
    recordProductEvent({ event: "harmony_beta_signup_succeeded", locale, method: source, platform: "harmony" });
    return true;
  })();
  harmonyNotifications.set(phone, delivery);
  try {
    return await delivery;
  } finally {
    harmonyNotifications.delete(phone);
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }

  const rate = takeRateLimit(`beta-signup:${requestIp(request)}`, {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!rate.allowed) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let parsed: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return Response.json({ error: "payload_too_large" }, { status: 413 });
    }
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!isJsonObject(parsed)) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const body = parsed;

  // Hidden field: bots get a success-shaped response without storing data.
  if (typeof body.company === "string" && body.company.trim()) {
    return Response.json({ success: true, created: false });
  }

  const locale: SiteLocale = body.locale === "en" ? "en" : "zh";
  const source = typeof body.source === "string" && SOURCE_PATTERN.test(body.source)
    ? body.source
    : "landing";

  if (body.program === "harmony-invited-test") {
    const phone = normalizeHarmonyPhone(body.phone);
    if (!phone) return Response.json({ error: "invalid_phone" }, { status: 400 });
    const result = createHarmonyBetaSignup({ phone, locale, source });
    if (!result.notified) {
      if (!await deliverHarmonySignup(phone, locale, source)) {
        return Response.json({ error: "notification_failed" }, { status: 503 });
      }
    }
    return Response.json({ success: true, created: result.created }, { status: result.created ? 201 : 200 });
  }

  const email = normalizeEmail(body.email);
  if (!email || body.program !== "ios-testflight") {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  if (iosDistribution().status !== "accepting") {
    return Response.json({ error: "signups_closed" }, { status: 409 });
  }

  const result = createIosBetaSignup({
    email,
    locale,
    source,
  });
  if (result.created) {
    recordProductEvent({
      event: "ios_beta_signup_succeeded",
      locale,
      method: source,
      platform: "ios",
    });
    await notifyIosBetaSignup(email);
  }

  return Response.json(
    { success: true, created: result.created },
    { status: result.created ? 201 : 200 },
  );
}
