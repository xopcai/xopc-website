import { isProductEventName, type DeviceType } from "@/lib/product-events";
import { requestIp, takeRateLimit } from "@/lib/request-rate-limit";
import { recordProductEvent, type SiteLocale } from "@/lib/site-database.server";

export const runtime = "nodejs";

const DIMENSION_PATTERN = /^[a-z0-9-]{1,32}$/;
const VERSION_PATTERN = /^[a-zA-Z0-9._+-]{1,64}$/;
const MAX_BODY_BYTES = 4_096;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOMAIN_PATTERN = /^(?=.{1,253}$)[a-z0-9.-]+$/;
const DEVICE_TYPES = new Set<DeviceType>(["desktop", "mobile", "tablet"]);

function dimension(value: unknown): string | undefined {
  return typeof value === "string" && DIMENSION_PATTERN.test(value) ? value : undefined;
}

function versionDimension(value: unknown): string | undefined {
  return typeof value === "string" && VERSION_PATTERN.test(value) ? value : undefined;
}

function uuid(value: unknown): string | undefined {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : undefined;
}

function limitedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(normalized)
    ? normalized
    : undefined;
}

function eventPath(value: unknown): string | undefined {
  const path = limitedText(value, 160);
  return path?.startsWith("/") ? path : undefined;
}

function occurredAt(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const timestamp = Date.parse(value);
  const now = Date.now();
  if (!Number.isFinite(timestamp) || timestamp < now - 86_400_000 || timestamp > now + 300_000) return undefined;
  return new Date(timestamp).toISOString();
}

export async function POST(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  const userAgent = request.headers.get("user-agent") ?? "";
  if ((fetchSite && fetchSite !== "same-origin") || /bot|crawler|spider|headlesschrome|lighthouse/i.test(userAgent)) {
    return new Response(null, { status: 204 });
  }

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
  const eventId = uuid(body.eventId);
  const sessionId = uuid(body.sessionId);
  const path = eventPath(body.path);
  if (!eventId || !sessionId || !path) {
    return Response.json({ error: "invalid_event_context" }, { status: 400 });
  }
  const locale: SiteLocale = body.locale === "en" ? "en" : "zh";
  recordProductEvent({
    event: body.event,
    eventId,
    sessionId,
    locale,
    path,
    referrerDomain: typeof body.referrerDomain === "string" && DOMAIN_PATTERN.test(body.referrerDomain)
      ? body.referrerDomain
      : undefined,
    utmSource: limitedText(body.utmSource, 80),
    utmMedium: limitedText(body.utmMedium, 80),
    utmCampaign: limitedText(body.utmCampaign, 120),
    deviceType: typeof body.deviceType === "string" && DEVICE_TYPES.has(body.deviceType as DeviceType)
      ? body.deviceType as DeviceType
      : undefined,
    method: dimension(body.method),
    platform: dimension(body.platform),
    architecture: dimension(body.architecture),
    version: versionDimension(body.version),
    recommended: typeof body.recommended === "boolean" ? body.recommended : undefined,
    occurredAt: occurredAt(body.occurredAt),
  });
  return new Response(null, { status: 204 });
}
