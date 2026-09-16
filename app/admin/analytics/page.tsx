import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { getAnalyticsSummary, type AnalyticsMetric } from "@/lib/analytics-summary.server";

import "./analytics.css";

export const metadata: Metadata = {
  title: "Website analytics · xopc",
  robots: { index: false, follow: false },
};

function percent(numerator: number, denominator: number): string {
  return denominator ? `${Math.round((numerator / denominator) * 100)}%` : "—";
}

function Breakdown({ title, rows }: { title: string; rows: AnalyticsMetric[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <section className="analytics-panel">
      <h2>{title}</h2>
      {rows.length ? (
        <ol className="analytics-breakdown">
          {rows.map((row) => (
            <li key={row.label}>
              <span>{row.label}</span>
              <i style={{ "--bar-width": `${(row.value / max) * 100}%` } as CSSProperties} />
              <strong>{row.value.toLocaleString()}</strong>
            </li>
          ))}
        </ol>
      ) : <p className="analytics-empty">暂无数据</p>}
    </section>
  );
}

export default async function AnalyticsPage() {
  await connection();
  const summary = getAnalyticsSummary(30);
  const maxDaily = Math.max(...summary.daily.map((day) => day.pageViews), 1);
  const cards = [
    ["页面访问", summary.totals.pageViews],
    ["访问会话", summary.totals.sessions],
    ["下载区会话", summary.totals.downloadSectionSessions],
    ["下载点击会话", summary.totals.downloadClickSessions],
    ["安装包请求", summary.totals.downloadStarts],
    ["iOS 新报名", summary.totals.signups],
  ] as const;

  return (
    <main className="analytics-page">
      <header className="analytics-header">
        <div>
          <p>xopc website</p>
          <h1>数据概览</h1>
        </div>
        <span>最近 {summary.days} 天 · 实时查询</span>
      </header>

      <section className="analytics-cards" aria-label="关键指标">
        {cards.map(([label, value]) => (
          <article key={label}><span>{label}</span><strong>{value.toLocaleString()}</strong></article>
        ))}
      </section>

      <section className="analytics-panel analytics-funnel">
        <div className="analytics-panel-heading">
          <h2>下载漏斗</h2>
          <span>点击转化 {percent(summary.totals.downloadClickSessions, summary.totals.sessions)}</span>
        </div>
        <ol>
          {[
            ["访问网站", summary.totals.sessions],
            ["看到下载区", summary.totals.downloadSectionSessions],
            ["点击下载", summary.totals.downloadClickSessions],
          ].map(([label, value]) => (
            <li key={label}><span>{label}</span><strong>{value.toLocaleString()}</strong></li>
          ))}
        </ol>
        <p>“安装包请求”为服务端独立结果指标；为保护隐私，不将服务端下载与标签页会话做持久关联。</p>
      </section>

      <section className="analytics-panel">
        <h2>每日趋势</h2>
        {summary.daily.length ? (
          <div className="analytics-chart" aria-label="每日页面访问趋势">
            {summary.daily.map((day) => (
              <div key={day.date} title={`${day.date}: ${day.pageViews} PV / ${day.sessions} sessions`}>
                <i style={{ height: `${Math.max((day.pageViews / maxDaily) * 100, 2)}%` }} />
                <span>{day.date.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : <p className="analytics-empty">暂无数据</p>}
      </section>

      <div className="analytics-grid">
        <Breakdown title="访问来源" rows={summary.sources} />
        <Breakdown title="UTM 活动" rows={summary.campaigns} />
        <Breakdown title="真实下载平台" rows={summary.platforms} />
        <Breakdown title="语言" rows={summary.locales} />
      </div>
    </main>
  );
}
