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
    title: zh ? "xopc 移动端隐私政策" : "xopc Mobile Privacy Policy",
    description: zh ? "xopc 移动端的数据处理、用户选择、保存与删除说明。" : "How xopc Mobile handles data, user choices, retention, and deletion.",
    alternates: { canonical: `/${locale}/privacy`, languages: { zh: "/zh/privacy", en: "/en/privacy", "x-default": "/en/privacy" } },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params;
  if (!isLocale(loc)) notFound();
  const locale = loc as Locale;
  return <LegalPage locale={locale} messages={getMessages(locale)} kind="privacy" />;
}
