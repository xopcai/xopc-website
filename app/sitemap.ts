import type { MetadataRoute } from "next";

import { productSlugs } from "@/components/product-page";
import { locales } from "@/lib/i18n/config";

const origin = "https://xopc.ai";

function languageAlternates(path = "") {
  return {
    zh: `${origin}/zh${path}`,
    en: `${origin}/en${path}`,
    "x-default": `${origin}/en${path}`,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const homePages = locales.map((locale) => ({
    url: `${origin}/${locale}`,
    changeFrequency: "weekly" as const,
    priority: 1,
    alternates: { languages: languageAlternates() },
  }));

  const productPages = productSlugs.flatMap((product) =>
    locales.map((locale) => ({
      url: `${origin}/${locale}/products/${product}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: { languages: languageAlternates(`/products/${product}`) },
    })),
  );

  return [...homePages, ...productPages];
}
