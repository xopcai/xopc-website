import { Suspense } from "react";
import { ProductMapQuery } from "@/components/product-map/product-map-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LocalizedProductMap } from "@/components/product-map/localized-product-map";
import { docBaseUrl, isLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getProductMapMessages } from "@/lib/product-map/messages";
import "./product-map.css";
import "./refinement.css";

type Props = {
  params: Promise<{ locale: string }>;
};
export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { ui } = getProductMapMessages(locale);
  return {
    title: ui.title,
    description: ui.metaDescription,
    alternates: {
      canonical: `/${locale}/product-map`,
      languages: {
        ...Object.fromEntries(
          locales.map((lang) => [lang, `/${lang}/product-map`]),
        ),
        "x-default": "/en/product-map",
      },
    },
    openGraph: {
      title: `${ui.title} · xopc`,
      description: ui.metaDescription,
      url: `/${locale}/product-map`,
      siteName: "xopc",
      locale: locale === "zh" ? "zh_CN" : "en_US",
      alternateLocale: locale === "zh" ? "en_US" : "zh_CN",
      type: "website",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${ui.title} · xopc`,
      description: ui.metaDescription,
      images: ["/opengraph-image"],
    },
  };
}
export default async function ProductMapRoute({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const props = {
    locale,
    header: messages.header,
    nav: messages.landing.nav,
    docHome: docBaseUrl(locale),
  };
  return (
    <Suspense fallback={<LocalizedProductMap {...props} initialView="map" initialNode="onboard" initialQuery="" initialGroup="start" />}>
      <ProductMapQuery {...props} />
    </Suspense>
  );
}
