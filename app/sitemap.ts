import type { MetadataRoute } from "next";

import { blogArticles, blogAlternates } from "@/lib/blog";
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

  const legalPages = ["privacy", "support"].flatMap((page) =>
    locales.map((locale) => ({
      url: `${origin}/${locale}/${page}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      alternates: { languages: languageAlternates(`/${page}`) },
    })),
  );

  const mobilePages = locales.map((locale) => ({
    url: `${origin}/${locale}/mobile`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
    alternates: { languages: languageAlternates("/mobile") },
  }));

  const mapPages = locales.map((locale) => ({
    url: `${origin}/${locale}/product-map`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
    alternates: { languages: languageAlternates("/product-map") },
  }));

  const learnPages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${origin}/${locale}/learn`,
    changeFrequency: "monthly",
    priority: 0.8,
    alternates: { languages: languageAlternates("/learn") },
  }));

  const useCasePages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${origin}/${locale}/use-cases`,
    changeFrequency: "monthly",
    priority: 0.9,
    alternates: { languages: languageAlternates("/use-cases") },
  }));

  const blogPages: MetadataRoute.Sitemap = [
    ...locales.map((locale) => ({ url: `${origin}/${locale}/blog`, changeFrequency: "monthly" as const, priority: 0.8, alternates: { languages: languageAlternates("/blog") } })),
    ...blogArticles.map((article) => ({ url: `${origin}${article.path}`, lastModified: article.date, changeFrequency: "monthly" as const, priority: 0.8, alternates: { languages: Object.fromEntries(Object.entries(blogAlternates(article.slug)).map(([locale, path]) => [locale, `${origin}${path}`])) } })),
  ];

  return [...blogPages, ...homePages, ...useCasePages, ...productPages, ...mapPages, ...learnPages, ...mobilePages, ...legalPages];
}
