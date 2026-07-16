import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductPage, isProductSlug, productSlugs } from "@/components/product-page";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

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
      languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}/products/${product}`])),
    },
  };
}

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ locale: string; product: string }>;
}) {
  const { locale: loc, product } = await params;
  if (!isLocale(loc) || !isProductSlug(product)) notFound();

  const locale = loc as Locale;
  return <ProductPage locale={locale} messages={getMessages(locale)} productSlug={product} />;
}
