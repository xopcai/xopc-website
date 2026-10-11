import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPage } from "@/components/legal-page";
import { isLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "zh" ? "xopc 鸿蒙测试版用户协议" : "xopc HarmonyOS Test User Agreement",
    description: locale === "zh" ? "xopc 鸿蒙受邀测试版的服务范围、用户内容、隐私与退出说明。" : "Service, user content, privacy and leaving the xopc HarmonyOS invited test.",
    alternates: { canonical: `/${locale}/terms`, languages: { zh: "/zh/terms", en: "/en/terms", "x-default": "/en/terms" } },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage locale={locale} messages={getMessages(locale)} kind="terms" />;
}
