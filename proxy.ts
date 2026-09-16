import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

const COOKIE = "NEXT_LOCALE";

function safeEqual(left: string, right: string): boolean {
  let different = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    different |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return different === 0;
}

function authorizeAnalytics(request: NextRequest): NextResponse | null {
  const expectedUser = process.env.ANALYTICS_ADMIN_USER?.trim();
  const expectedPassword = process.env.ANALYTICS_ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) {
    return new NextResponse("Analytics admin is not configured.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try {
      const decoded = atob(authorization.slice(6));
      const separator = decoded.indexOf(":");
      const user = separator >= 0 ? decoded.slice(0, separator) : "";
      const password = separator >= 0 ? decoded.slice(separator + 1) : "";
      if (safeEqual(user, expectedUser) && safeEqual(password, expectedPassword)) return null;
    } catch {
      // Fall through to the authentication challenge.
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      "WWW-Authenticate": 'Basic realm="xopc analytics", charset="UTF-8"',
    },
  });
}

function preferredLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(COOKIE)?.value;
  if (fromCookie && isLocale(fromCookie)) return fromCookie;

  const al = request.headers.get("accept-language") ?? "";
  const lower = al.toLowerCase();
  if (lower.startsWith("zh") || lower.includes("zh-cn") || lower.includes("zh-hans")) {
    return "zh";
  }
  if (lower.startsWith("en")) return "en";

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const rejected = authorizeAnalytics(request);
    if (rejected) return rejected;
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (/\.[a-zA-Z0-9]+$/.test(pathname.split("/").pop() ?? "")) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first && isLocale(first)) {
    const res = NextResponse.next();
    res.cookies.set(COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }

  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();
  const rest = segments.length ? `/${segments.join("/")}` : "";
  url.pathname = `/${locale}${rest}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/(zh|en)(/.*)?", "/admin/:path*"],
};
