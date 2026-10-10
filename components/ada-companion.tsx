"use client";

import { useState } from "react";
import { Loopi, type LoopiMood } from "@/components/brand/loopi";
import type { Locale } from "@/lib/i18n/config";
import styles from "./ada-page.module.css";

const copy = {
  zh: { hello: "和 Ada 打个招呼", greeting: "嗨，我是 Ada。慢慢说，我在听。", hint: "点点 Ada，打个招呼。", prompts: ["今天有点忙", "有个新想法", "想聊一会儿"], replies: ["先别急。挑一件重要的事，我们一起理清。", "不必一下子想好。从你最期待的部分开始。", "好呀。今天有什么事，让你一直惦记着？"], helloReply: "很高兴见到你。下一件事，我们一起开始。" },
  en: { hello: "Say hello to Ada", greeting: "Hi, I’m Ada. Take your time. I’m listening.", hint: "Tap Ada to say hello.", prompts: ["A busy day", "A new idea", "Let’s talk"], replies: ["One thing at a time. Let’s find what matters most.", "It doesn’t have to be perfect. Start with what excites you.", "Of course. What’s been on your mind today?"], helloReply: "Good to see you. Let’s start your next thing together." },
} as const;
const moods: LoopiMood[] = ["care", "curious", "listen"];

export function AdaCompanion({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [selected, setSelected] = useState<number | null>(null);
  const [greeted, setGreeted] = useState(false);
  return <div className={styles.companion}>
    <div className={styles.companionGlow} aria-hidden />
    <Loopi interactive language={locale} mood={greeted ? "done" : selected === null ? "care" : moods[selected]} className={styles.companionLogo} ariaLabel={c.hello} onHello={() => { setGreeted(true); setSelected(null); }} />
    <p className={styles.companionBubble} aria-live="polite" aria-atomic="true">{greeted ? c.helloReply : selected === null ? c.greeting : c.replies[selected]}</p>
    <div className={styles.companionPrompts} role="group" aria-label={locale === "zh" ? "试试和 Ada 聊聊" : "A little conversation with Ada"}>{c.prompts.map((prompt, index) => <button key={prompt} type="button" aria-pressed={selected === index} onClick={() => { setSelected(index); setGreeted(false); }}>{prompt}</button>)}</div>
    <p className={styles.companionHint}>{c.hint}</p>
  </div>;
}
