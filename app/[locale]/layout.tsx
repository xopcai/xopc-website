import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ThemeDocumentSync } from "@/components/theme-document-sync";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { landingDisplayFont } from "@/lib/landing-fonts";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

import "../globals.css";

const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var d=${JSON.stringify(DEFAULT_THEME)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t=d;}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme",${JSON.stringify(DEFAULT_THEME)});}})();`;
const localeTransitionInitScript = `(function(){try{if(sessionStorage.getItem("xopc-locale-transition")==="1"){document.documentElement.classList.add("xopc-locale-transition-in");}}catch(e){}})();`;

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
    alternates: {
      canonical: `/${loc}`,
      languages: { zh: "/zh", en: "/en", "x-default": "/en" },
    },
    keywords: loc === "zh"
      ? ["私人 AI 助手", "本地优先 AI", "个人 AI Agent", "开源 AI", "AI 工作管理"]
      : ["personal AI assistant", "local-first AI", "personal AI agent", "open source AI", "AI work management"],
    title: {
      default: m.meta.title,
      template: "%s · xopc",
    },
    description: m.meta.description,
    openGraph: {
      title: m.meta.title,
      description: m.meta.ogDescription,
      url: `/${loc}`,
      siteName: "xopc",
      locale: loc === "zh" ? "zh_CN" : "en_US",
      alternateLocale: loc === "zh" ? "en_US" : "zh_CN",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "xopc — Keep what matters moving." }],
    },
    twitter: {
      card: "summary_large_image",
      title: m.meta.title,
      description: m.meta.ogDescription,
      images: ["/opengraph-image"],
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
      <body className={`${landingDisplayFont.variable} min-h-full flex flex-col landing-body`}>
        {/* Apply stored or system theme before paint to reduce flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeTransitionInitScript }} />
        <ThemeDocumentSync />
        {children}
      </body>
    </html>
  );
}
