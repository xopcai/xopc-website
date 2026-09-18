"use client";

import copy from "@/messages/product-map/zh.json";

import {
  ProductMap,
  type ProductMapRuntimeProps,
} from "./product-map";

export function ProductMapZh(props: ProductMapRuntimeProps) {
  return <ProductMap {...props} locale="zh" copy={copy} />;
}
