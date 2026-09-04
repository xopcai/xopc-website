import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPage } from "@/components/legal-page";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const zh = locale === "zh";
  return {
    title: zh ? "xopc 移动端支持" : "xopc Mobile Support",
    description: zh ? "xopc 移动端连接、配对、隐私和设备管理帮助。" : "Help with xopc Mobile connection, pairing, privacy, and device management.",
    alternates: { canonical: `/${locale}/support`, languages: { zh: "/zh/support", en: "/en/support", "x-default": "/en/support" } },
  };
}

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params;
  if (!isLocale(loc)) notFound();
  const locale = loc as Locale;
  return <LegalPage locale={locale} messages={getMessages(locale)} kind="support" />;
}
