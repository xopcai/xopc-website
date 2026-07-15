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

const siteUrl = "https://xopc.ai/";

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
    ...(loc === "zh"
      ? {
          keywords: [
            "自托管 AI",
            "个人 AI 运行时",
            "本地优先",
            "开源 AI",
            "AI Agent",
            "BYOK",
            "多 Agent",
            "AI 自动化",
          ],
        }
      : {}),
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
