"use client";

import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { mapGroups, nodeById, type MapView } from "@/lib/product-map/model";
import { LocalizedProductMap } from "./localized-product-map";
import type { ProductMapRuntimeProps } from "./product-map";

type Props = Pick<ProductMapRuntimeProps, "header" | "nav" | "docHome"> & { locale: Locale };

/** Query-dependent state stays behind Suspense so the default explorer is prerendered. */
export function ProductMapQuery(props: Props) {
  const search = useSearchParams();
  const value = (key: string) => search.getAll(key).length === 1 ? search.get(key)! : "";
  const requestedView = value("view");
  const initialView: MapView = ["map", "mindmap", "architecture", "catalog"].includes(requestedView)
    ? requestedView as MapView : "map";
  const initialNode = nodeById(value("node"))?.id ?? "onboard";
  const initialQuery = value("q").slice(0, 200);
  const initialGroup = mapGroups.find(group => group.id === value("group"))?.id ??
    (value("group") === "all" || initialView !== "map" || value("q") ? "" : nodeById(initialNode)!.group);
  return <LocalizedProductMap {...props} initialView={initialQuery ? "catalog" : initialView}
    initialNode={initialNode} initialQuery={initialQuery} initialGroup={initialGroup} />;
}
