"use client";

import copy from "@/messages/product-map/en.json";

import {
  ProductMap,
  type ProductMapRuntimeProps,
} from "./product-map";

export function ProductMapEn(props: ProductMapRuntimeProps) {
  return <ProductMap {...props} locale="en" copy={copy} />;
}
