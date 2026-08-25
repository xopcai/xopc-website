import { requestIp, takeRateLimit } from "@/lib/request-rate-limit";
import { createIosBetaSignup, type SiteLocale } from "@/lib/site-database.server";
import { notifyIosBetaSignup } from "@/lib/telegram-beta-notify";
import { iosDistribution } from "@/lib/distribution-config.server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 2_048;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

export async function POST(request: Request) {
  if (iosDistribution().status !== "accepting") {
    return Response.json({ error: "signups_closed" }, { status: 409 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }

  const rate = takeRateLimit(`ios-beta:${requestIp(request)}`, {
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

  const email = normalizeEmail(body.email);
  if (!email || body.program !== "ios-testflight") {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const locale: SiteLocale = body.locale === "en" ? "en" : "zh";

  const result = createIosBetaSignup({
    email,
    locale,
    source: "landing",
  });
  if (result.created) await notifyIosBetaSignup(email);

  return Response.json(
    { success: true, created: result.created },
    { status: result.created ? 201 : 200 },
  );
}
