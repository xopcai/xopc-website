import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductMap } from "@/components/product-map/product-map";
import { isLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getProductMapMessages } from "@/lib/product-map/messages";
import { mapGroups, nodeById, type MapView } from "@/lib/product-map/model";
import "./product-map.css";
import "./refinement.css";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { ui } = getProductMapMessages(locale);
  return {
    title: ui.title,
    description: ui.metaDescription,
    alternates: {
      canonical: `/${locale}/product-map`,
      languages: {
        ...Object.fromEntries(
          locales.map((lang) => [lang, `/${lang}/product-map`]),
        ),
        "x-default": "/en/product-map",
      },
    },
    openGraph: {
      title: `${ui.title} · xopc`,
      description: ui.metaDescription,
      url: `/${locale}/product-map`,
      siteName: "xopc",
      locale: locale === "zh" ? "zh_CN" : "en_US",
      alternateLocale: locale === "zh" ? "en_US" : "zh_CN",
      type: "website",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${ui.title} · xopc`,
      description: ui.metaDescription,
      images: ["/opengraph-image"],
    },
  };
}
export default async function ProductMapRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const search = await searchParams;
  const value = (key: string) =>
    typeof search[key] === "string" ? (search[key] as string) : "";
  const requestedView = value("view");
  const initialView: MapView = [
    "map",
    "mindmap",
    "architecture",
    "catalog",
  ].includes(requestedView)
    ? (requestedView as MapView)
    : "map";
  const initialNode = nodeById(value("node"))?.id ?? "onboard";
  const initialGroup =
    mapGroups.find((group) => group.id === value("group"))?.id ??
    (value("group") === "all" || initialView !== "map" || value("q")
      ? ""
      : nodeById(initialNode)!.group);
  const initialQuery = value("q").slice(0, 200);
  return (
    <ProductMap
      locale={locale}
      copy={getProductMapMessages(locale)}
      header={getMessages(locale).header}
      initialView={initialQuery ? "catalog" : initialView}
      initialNode={initialNode}
      initialQuery={initialQuery}
      initialGroup={initialGroup}
    />
  );
}
