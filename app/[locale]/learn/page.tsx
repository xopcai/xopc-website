import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n/config";
import { CourseLibrary } from "@/components/learn/course-library";
import "../product-map/product-map.css";
import "./learn.css";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ course?: string }> };
export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: locale === "zh" ? "按场景学习" : "Learn by doing", description: locale === "zh" ? "桌面实战工作流程，配套中文视频、图文步骤和可下载练习材料。" : "Desktop workflows with Chinese video tutorials, illustrated steps and downloadable practice files.", alternates: { canonical: `/${locale}/learn`, languages: Object.fromEntries(locales.map(lang => [lang, `/${lang}/learn`])) } };
}
export default async function Learn({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { course } = await searchParams;
  return <CourseLibrary locale={locale} initialCourse={typeof course === "string" ? course : ""}/>;
}
