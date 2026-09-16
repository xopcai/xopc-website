import "dotenv/config";

import path from "node:path";

import Database from "better-sqlite3";

const DAY_MS = 86_400_000;
const DOWNLOAD_CLICK_EVENTS = [
  "desktop_download_clicked",
  "android_download_clicked",
  "ios_download_clicked",
];

function databasePath() {
  const configured = process.env.SITE_DATABASE_PATH?.trim();
  if (!configured) return path.join(process.cwd(), ".data", "xopc-website.sqlite3");
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

function reportData() {
  const database = new Database(databasePath(), { readonly: true, fileMustExist: true });
  try {
    const columns = new Set(database.prepare("PRAGMA table_info(product_events)").all().map((row) => row.name));
    if (!columns.has("session_id")) {
      throw new Error("Analytics database is not migrated; start the website before running the report");
    }
    const start = new Date(Date.now() - DAY_MS).toISOString();
    const placeholders = DOWNLOAD_CLICK_EVENTS.map(() => "?").join(", ");
    const totals = database.prepare(`
      SELECT
        SUM(event = 'page_viewed') AS pageViews,
        COUNT(DISTINCT CASE WHEN event = 'page_viewed' THEN session_id END) AS sessions,
        COUNT(DISTINCT CASE WHEN event = 'download_section_viewed' THEN session_id END) AS downloadSectionSessions,
        COUNT(DISTINCT CASE WHEN event IN (${placeholders}) THEN session_id END) AS downloadClickSessions,
        SUM(event = 'download_started') AS downloadStarts,
        SUM(event = 'ios_beta_signup_succeeded') AS signups
      FROM product_events
      WHERE created_at >= ?
    `).get(...DOWNLOAD_CLICK_EVENTS, start);
    const sources = database.prepare(`
      SELECT COALESCE(utm_source, referrer_domain, 'direct') AS label, COUNT(*) AS value
      FROM product_events
      WHERE event = 'page_viewed' AND created_at >= ?
      GROUP BY label
      ORDER BY value DESC, label
      LIMIT 3
    `).all(start);
    const platforms = database.prepare(`
      SELECT COALESCE(platform, 'unknown') AS label, COUNT(*) AS value
      FROM product_events
      WHERE event = 'download_started' AND created_at >= ?
      GROUP BY label
      ORDER BY value DESC, label
    `).all(start);
    return { totals, sources, platforms };
  } finally {
    database.close();
  }
}

function number(value) {
  return Number(value ?? 0).toLocaleString("zh-CN");
}

function percentage(value, total) {
  return total ? `${Math.round((value / total) * 100)}%` : "—";
}

function breakdown(label, rows) {
  return rows.length
    ? `${label}：${rows.map((row) => `${row.label} ${number(row.value)}`).join("、")}`
    : `${label}：暂无数据`;
}

function formatReport(data) {
  const { totals, sources, platforms } = data;
  const end = new Date();
  const start = new Date(end.getTime() - DAY_MS);
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return [
    "📊 xopc 官网数据日报",
    `统计周期：${formatter.format(start)} – ${formatter.format(end)}（北京时间）`,
    "",
    `访问：${number(totals.pageViews)} PV / ${number(totals.sessions)} 会话`,
    `下载区曝光：${number(totals.downloadSectionSessions)} 会话`,
    `下载点击：${number(totals.downloadClickSessions)} 会话（转化率 ${percentage(totals.downloadClickSessions, totals.sessions)}）`,
    `真实安装包请求：${number(totals.downloadStarts)}`,
    `iOS 新报名：${number(totals.signups)}`,
    "",
    breakdown("主要来源", sources),
    breakdown("下载平台", platforms),
    "",
    "查看完整数据：https://xopc.ai/admin/analytics",
  ].join("\n");
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Telegram returned ${response.status}: ${detail.slice(0, 200)}`);
  }
}

const report = formatReport(reportData());
if (process.argv.includes("--dry-run")) {
  console.log(report);
} else {
  await sendTelegram(report);
  console.log(`Analytics report sent at ${new Date().toISOString()}`);
}
