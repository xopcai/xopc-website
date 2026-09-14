import type { Locale } from "@/lib/i18n/config";
import en from "@/messages/product-map/en.json";
import zh from "@/messages/product-map/zh.json";

export type ProductMapMessages = typeof zh;
const messages: Record<Locale, ProductMapMessages> = { zh, en };
export function getProductMapMessages(locale: Locale): ProductMapMessages {
  return messages[locale];
}
