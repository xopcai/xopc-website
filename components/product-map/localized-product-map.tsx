"use client";

import dynamic from "next/dynamic";

import type { Locale } from "@/lib/i18n/config";

import type { ProductMapRuntimeProps } from "./product-map";

const ProductMapEn = dynamic(() =>
  import("./product-map-en").then((module) => module.ProductMapEn),
);
const ProductMapZh = dynamic(() =>
  import("./product-map-zh").then((module) => module.ProductMapZh),
);

type Props = ProductMapRuntimeProps & { locale: Locale };

export function LocalizedProductMap({ locale, ...props }: Props) {
  const Component = locale === "zh" ? ProductMapZh : ProductMapEn;

  return <Component {...props} />;
}
