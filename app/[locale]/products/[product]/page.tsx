import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ProductPage, isProductSlug, productSlugs } from "@/components/product-page";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

const legacyProductRedirects: Record<string, "desktop" | "terminal"> = {
  operator: "desktop",
  worker: "desktop",
  code: "terminal",
};

export function generateStaticParams() {
  return productSlugs.map((product) => ({ product }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; product: string }>;
}): Promise<Metadata> {
  const { locale: loc, product } = await params;
  if (!isLocale(loc) || !isProductSlug(product)) return {};
  const P = getMessages(loc).landing.products[product];

  return {
    title: P.metaTitle,
    description: P.metaDescription,
    alternates: {
      canonical: `/${loc}/products/${product}`,
      languages: {
        ...Object.fromEntries(locales.map((locale) => [locale, `/${locale}/products/${product}`])),
        "x-default": `/en/products/${product}`,
      },
    },
    openGraph: {
      title: P.metaTitle,
      description: P.metaDescription,
      url: `/${loc}/products/${product}`,
      siteName: "xopc",
      locale: loc === "zh" ? "zh_CN" : "en_US",
      alternateLocale: loc === "zh" ? "en_US" : "zh_CN",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "xopc — Keep what matters moving." }],
    },
    twitter: {
      card: "summary_large_image",
      title: P.metaTitle,
      description: P.metaDescription,
      images: ["/opengraph-image"],
    },
  };
}

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ locale: string; product: string }>;
}) {
  const { locale: loc, product } = await params;
  if (!isLocale(loc)) notFound();
  const redirectProduct = legacyProductRedirects[product];
  if (redirectProduct) permanentRedirect(`/${loc}/products/${redirectProduct}`);
  if (!isProductSlug(product)) notFound();

  const locale = loc as Locale;
  return <ProductPage locale={locale} messages={getMessages(locale)} productSlug={product} />;
}
