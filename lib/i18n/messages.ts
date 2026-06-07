import type { Locale } from "./config";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

export type Messages = typeof zh;

const byLocale: Record<Locale, Messages> = {
  zh,
  en,
};

export function getMessages(locale: Locale): Messages {
  return byLocale[locale];
}
