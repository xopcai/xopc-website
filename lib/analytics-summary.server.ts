import "server-only";

import { getSiteDatabase } from "@/lib/site-database.server";

export type AnalyticsMetric = {
  label: string;
  value: number;
};

export type AnalyticsDay = {
  date: string;
  pageViews: number;
  sessions: number;
  downloadClicks: number;
  downloadStarts: number;
  signups: number;
};

export type AnalyticsSummary = {
  days: number;
  totals: {
    pageViews: number;
    sessions: number;
    downloadSectionSessions: number;
    downloadClickSessions: number;
    downloadStarts: number;
    signups: number;
  };
  daily: AnalyticsDay[];
  sources: AnalyticsMetric[];
  campaigns: AnalyticsMetric[];
  platforms: AnalyticsMetric[];
  locales: AnalyticsMetric[];
};

const DOWNLOAD_CLICK_EVENTS = [
  "desktop_download_clicked",
  "android_download_clicked",
  "ios_download_clicked",
] as const;

function periodStart(days: number): string {
  return `-${days - 1} days`;
}

export function getAnalyticsSummary(days = 30): AnalyticsSummary {
  const database = getSiteDatabase();
  const start = periodStart(days);
  const clickPlaceholders = DOWNLOAD_CLICK_EVENTS.map(() => "?").join(", ");
  const totalRow = database.prepare(`
    SELECT
      SUM(event = 'page_viewed') AS pageViews,
      COUNT(DISTINCT CASE WHEN event = 'page_viewed' THEN session_id END) AS sessions,
      COUNT(DISTINCT CASE WHEN event = 'download_section_viewed' THEN session_id END) AS downloadSectionSessions,
      COUNT(DISTINCT CASE WHEN event IN (${clickPlaceholders}) THEN session_id END) AS downloadClickSessions,
      SUM(event = 'download_started') AS downloadStarts,
      SUM(event = 'ios_beta_signup_succeeded') AS signups
    FROM product_events
    WHERE created_at >= datetime('now', ?)
  `).get(...DOWNLOAD_CLICK_EVENTS, start) as Record<string, number | null>;

  const dailyRows = database.prepare(`
    SELECT
      date(created_at, 'localtime') AS date,
      SUM(event = 'page_viewed') AS pageViews,
      COUNT(DISTINCT CASE WHEN event = 'page_viewed' THEN session_id END) AS sessions,
      SUM(event IN (${clickPlaceholders})) AS downloadClicks,
      SUM(event = 'download_started') AS downloadStarts,
      SUM(event = 'ios_beta_signup_succeeded') AS signups
    FROM product_events
    WHERE created_at >= datetime('now', ?)
    GROUP BY date(created_at, 'localtime')
    ORDER BY date
  `).all(...DOWNLOAD_CLICK_EVENTS, start) as Array<Record<string, string | number>>;

  const metricQuery = (expression: string, event: string): AnalyticsMetric[] =>
    database.prepare(`
      SELECT ${expression} AS label, COUNT(*) AS value
      FROM product_events
      WHERE event = ? AND created_at >= datetime('now', ?)
      GROUP BY label
      ORDER BY value DESC, label
      LIMIT 8
    `).all(event, start) as AnalyticsMetric[];

  const totals = {
    pageViews: Number(totalRow.pageViews ?? 0),
    sessions: Number(totalRow.sessions ?? 0),
    downloadSectionSessions: Number(totalRow.downloadSectionSessions ?? 0),
    downloadClickSessions: Number(totalRow.downloadClickSessions ?? 0),
    downloadStarts: Number(totalRow.downloadStarts ?? 0),
    signups: Number(totalRow.signups ?? 0),
  };

  return {
    days,
    totals,
    daily: dailyRows.map((row) => ({
      date: String(row.date),
      pageViews: Number(row.pageViews),
      sessions: Number(row.sessions),
      downloadClicks: Number(row.downloadClicks),
      downloadStarts: Number(row.downloadStarts),
      signups: Number(row.signups),
    })),
    sources: metricQuery("COALESCE(utm_source, referrer_domain, 'direct')", "page_viewed"),
    campaigns: metricQuery("COALESCE(utm_campaign, 'none')", "page_viewed"),
    platforms: metricQuery("COALESCE(platform, 'unknown')", "download_started"),
    locales: metricQuery("locale", "page_viewed"),
  };
}
