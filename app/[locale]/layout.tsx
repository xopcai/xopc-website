import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ThemeDocumentSync } from "@/components/theme-document-sync";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { THEME_STORAGE_KEY } from "@/lib/theme";

import "../globals.css";

const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

const siteUrl = "https://xopcai.github.io/xopc/";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: loc } = await params;
  if (!isLocale(loc)) return {};
  const m = getMessages(loc);

  return {
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${loc}`,
      languages: { zh: "/zh", en: "/en" },
    },
    title: {
      default: m.meta.title,
      template: "%s · xopc",
    },
    description: m.meta.description,
    openGraph: {
      title: m.meta.title,
      description: m.meta.ogDescription,
      url: siteUrl,
      siteName: "xopc",
      locale: loc === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: m.meta.title,
      description: m.meta.ogDescription,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: loc } = await params;
  if (!isLocale(loc)) notFound();
  const locale = loc as Locale;

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} suppressHydrationWarning>
      <body className="min-h-full flex flex-col landing-body">
        {/* Apply stored or system theme before paint to reduce flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeDocumentSync />
        {children}
      </body>
    </html>
  );
}
