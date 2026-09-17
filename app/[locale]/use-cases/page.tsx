import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UseCaseExplorer } from "@/components/use-cases/use-case-explorer";
import { docBaseUrl, isLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

import "../product-map/product-map.css";
import "./use-cases.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const zh = locale === "zh";
  return {
    title: zh ? "xopc 使用场景" : "What you can do with xopc",
    description: zh
      ? "从真实任务开始了解 xopc：邮件、研究、文件、代码、浏览器和自动化场景，包含准备条件、确认边界与可验证结果。"
      : "Start with real work: practical xopc scenarios for email, research, files, code, browser tasks, and automation, with setup, approval boundaries, and verifiable outcomes.",
    alternates: {
      canonical: `/${locale}/use-cases`,
      languages: Object.fromEntries([...locales.map((lang) => [lang, `/${lang}/use-cases`]), ["x-default", "/en/use-cases"]]),
    },
    openGraph: {
      title: zh ? "别从功能开始，从你想完成的事开始。" : "Don't start with features. Start with what you need done.",
      description: zh ? "探索由 xopc 真实产品能力支持的使用场景。" : "Explore practical scenarios backed by real xopc capabilities.",
      url: `/${locale}/use-cases`,
      type: "website",
    },
  };
}

export default async function UseCasesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <UseCaseExplorer locale={locale} messages={getMessages(locale)} docHome={docBaseUrl(locale)} />;
}
