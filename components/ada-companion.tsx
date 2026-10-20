"use client";

import { useState } from "react";
import { Loopi, type LoopiMood } from "@/components/brand/loopi";
import type { Locale } from "@/lib/i18n/config";
import styles from "./ada-page.module.css";

const copy = {
  zh: { hello: "和 Ada 打个招呼", greeting: "嗨，我是 Ada。慢慢说，我们一起把事情往前推。", hint: "互动示例 · 在 xopc 中交办真实任务。", prompts: ["理清这周重点", "把想法变成计划", "继续上次的事"], replies: ["先把固定安排和最重要的目标放在一起，再留些余地。", "从想做成什么开始，一起拆出可以交办的第一步。", "接回项目里的决定和结果，找到值得继续的一步。"], helloReply: "很高兴见到你。下一件事，我们一起开始。" },
  en: { hello: "Say hello to Ada", greeting: "Hi, I’m Ada. Take your time. Let’s move something forward.", hint: "Interactive example · Delegate real tasks in xopc.", prompts: ["Find this week’s priorities", "Turn an idea into a plan", "Pick up where I left off"], replies: ["Start with your commitments and most important goal. Leave some breathing room.", "Tell me what you want to make. Let’s find a first step you can hand over.", "Bring back the project’s decisions and results, then find what comes next."], helloReply: "Good to see you. Let’s start your next thing together." },
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
