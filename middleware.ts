import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

const COOKIE = "NEXT_LOCALE";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/", "/(zh|en)(/.*)?"],
};
