import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdaPage } from "@/components/ada-page";
import { adaCopy } from "@/lib/ada-copy";
import { docBaseUrl, isLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = adaCopy[locale];
  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: { canonical: `/${locale}/ada`, languages: Object.fromEntries([...locales.map(lang => [lang, `/${lang}/ada`]), ["x-default", "/en/ada"]]) },
    openGraph: { title: c.meta.title, description: c.meta.description, url: `/${locale}/ada`, type: "website" },
    twitter: { card: "summary_large_image", title: c.meta.title, description: c.meta.description },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <main className="flex-1"><AdaPage locale={locale} messages={getMessages(locale)} docHome={docBaseUrl(locale)} /></main>;
}
