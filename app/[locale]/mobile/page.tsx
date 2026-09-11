import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { MobileDownloadPage, type MobilePlatform } from "@/components/mobile-download-page";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

function detectMobilePlatform(userAgent: string): MobilePlatform {
  return /iPhone|iPad|iPod/i.test(userAgent) ? "ios" : "android";
}

function attributionSource(value: string | string[] | undefined): string | undefined {
  const source = Array.isArray(value) ? value[0] : value;
  return source && /^[a-z0-9-]{1,32}$/.test(source) ? source : undefined;
}

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: loc } = await params;
  if (!isLocale(loc)) return {};
  const page = getMessages(loc).landing.mobilePage;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `/${loc}/mobile`,
      languages: { zh: "/zh/mobile", en: "/en/mobile", "x-default": "/en/mobile" },
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `/${loc}/mobile`,
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: page.metaTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
      images: ["/opengraph-image"],
    },
  };
}

export default async function MobilePage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ source?: string | string[] }>;
}) {
  const [{ locale: loc }, query, requestHeaders] = await Promise.all([params, searchParams, headers()]);
  if (!isLocale(loc)) notFound();
  const locale = loc as Locale;
  const platform = detectMobilePlatform(requestHeaders.get("user-agent") ?? "");

  return (
    <MobileDownloadPage
      locale={locale}
      messages={getMessages(locale)}
      initialPlatform={platform}
      source={attributionSource(query.source)}
    />
  );
}
