export const memoryArticle = {
  slug: "when-memory-changes",
  title: "当用户改变主意：个人 Agent 如何更新自己的记忆？",
  description: "一句“以后改成这样”，会让 Agent 的记忆系统发生什么？从事实的身份、纠正与过期，到回答前的筛选，拆解 xopc 如何处理变化中的用户信息。",
  date: "2026-09-21",
  author: "xopc",
  readingTime: "约 12 分钟",
  sourceRevision: "abf0e54361724c784cd693c591f5843449db93ef",
} as const;
export const memoryArticlePath = `/zh/blog/${memoryArticle.slug}`;
export const memoryArticleSections = [
  ["a-small-correction", "从一句纠正开始"],
  ["different-kinds", "先分清记住的是什么"],
  ["identity", "给事实一个稳定的位置"],
  ["correction", "新信息怎样替代旧信息"],
  ["time", "过期的记忆在哪里停下来"],
  ["before-answering", "回答前，还要再选一次"],
  ["verification", "如何验证，哪里仍会出错"],
] as const;
