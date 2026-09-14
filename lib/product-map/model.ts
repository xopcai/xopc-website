import manifest from "./manifest.json";
import type { ProductMapMessages } from "./messages";

export type NodeId = keyof ProductMapMessages["nodes"];
export type GroupId = keyof ProductMapMessages["groups"];
export type JourneyId = keyof ProductMapMessages["journeys"];
export type MapView = "map" | "mindmap" | "architecture" | "catalog";
export type MapNode = { id: NodeId; group: GroupId; related: NodeId[]; source: string; status: "available" | "experimental" | "evolving"; docLocale: "localized" | "en" };
export const mapGroups = manifest.groups as { id: GroupId; number: string; color: string; ids: NodeId[] }[];
export const mapNodes = manifest.nodes as MapNode[];
export const mapJourneys = manifest.journeys as { id: JourneyId; ids: NodeId[] }[];
export const mapLayers = manifest.layers as NodeId[][];
export function nodeById(id: string): MapNode | undefined { return mapNodes.find(node => node.id === id); }
export function interpolate(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
