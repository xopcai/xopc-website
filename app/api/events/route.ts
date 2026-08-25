import { isProductEventName } from "@/lib/product-events";
import { requestIp, takeRateLimit } from "@/lib/request-rate-limit";
import { recordProductEvent, type SiteLocale } from "@/lib/site-database.server";

export const runtime = "nodejs";

const DIMENSION_PATTERN = /^[a-z0-9-]{1,32}$/;
const MAX_BODY_BYTES = 2_048;

function dimension(value: unknown): string | undefined {
  return typeof value === "string" && DIMENSION_PATTERN.test(value) ? value : undefined;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }

  const rate = takeRateLimit(`events:${requestIp(request)}`, {
    limit: 60,
    windowMs: 10 * 60_000,
  });
  if (!rate.allowed) return new Response(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return Response.json({ error: "payload_too_large" }, { status: 413 });
    }
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isProductEventName(body.event)) {
    return Response.json({ error: "invalid_event" }, { status: 400 });
  }
  const locale: SiteLocale = body.locale === "en" ? "en" : "zh";
  recordProductEvent({
    event: body.event,
    locale,
    method: dimension(body.method),
    platform: dimension(body.platform),
  });
  return new Response(null, { status: 204 });
}
