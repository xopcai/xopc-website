import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import type { DeviceType, ProductEventName } from "@/lib/product-events";

export type SiteLocale = "zh" | "en";

type SignupInput = {
  email: string;
  locale: SiteLocale;
  source: string;
};

type ProductEventInput = {
  event: ProductEventName;
  eventId?: string;
  sessionId?: string;
  locale: SiteLocale;
  path?: string;
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: DeviceType;
  method?: string;
  platform?: string;
  architecture?: string;
  version?: string;
  recommended?: boolean;
  occurredAt?: string;
};

let database: Database.Database | null = null;

function databasePath(): string {
  const configured = process.env.SITE_DATABASE_PATH?.trim();
  if (!configured) {
    return path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "xopc-website.sqlite3");
  }
  return path.isAbsolute(configured)
    ? configured
    : path.join(/* turbopackIgnore: true */ process.cwd(), configured);
}

export function getSiteDatabase(): Database.Database {
  if (database) return database;
  const filename = databasePath();
  mkdirSync(/* turbopackIgnore: true */ path.dirname(filename), { recursive: true });
  database = new Database(/* turbopackIgnore: true */ filename);
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
  database.exec(`
    CREATE TABLE IF NOT EXISTS beta_signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      program TEXT NOT NULL CHECK (program = 'ios-testflight'),
      locale TEXT NOT NULL CHECK (locale IN ('zh', 'en')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'accepted', 'removed')),
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      invited_at TEXT,
      UNIQUE(email, program)
    );
    CREATE TABLE IF NOT EXISTS product_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      event_id TEXT,
      session_id TEXT,
      locale TEXT NOT NULL CHECK (locale IN ('zh', 'en')),
      path TEXT,
      referrer_domain TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
      method TEXT,
      platform TEXT,
      architecture TEXT,
      version TEXT,
      recommended INTEGER CHECK (recommended IN (0, 1)),
      occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS product_events_created_at ON product_events(created_at);
  `);
  const productEventColumns = new Set(
    database.prepare("PRAGMA table_info(product_events)").all().map((row) => (row as { name: string }).name),
  );
  if (!productEventColumns.has("architecture")) {
    database.exec("ALTER TABLE product_events ADD COLUMN architecture TEXT");
  }
  if (!productEventColumns.has("version")) {
    database.exec("ALTER TABLE product_events ADD COLUMN version TEXT");
  }
  if (!productEventColumns.has("recommended")) {
    database.exec("ALTER TABLE product_events ADD COLUMN recommended INTEGER CHECK (recommended IN (0, 1))");
  }
  const newColumns = [
    ["event_id", "TEXT"],
    ["session_id", "TEXT"],
    ["path", "TEXT"],
    ["referrer_domain", "TEXT"],
    ["utm_source", "TEXT"],
    ["utm_medium", "TEXT"],
    ["utm_campaign", "TEXT"],
    ["device_type", "TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet'))"],
    ["occurred_at", "TEXT"],
  ] as const;
  for (const [name, definition] of newColumns) {
    if (!productEventColumns.has(name)) {
      database.exec(`ALTER TABLE product_events ADD COLUMN ${name} ${definition}`);
    }
  }
  database.exec(`
    UPDATE product_events SET occurred_at = created_at WHERE occurred_at IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS product_events_event_id ON product_events(event_id) WHERE event_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS product_events_event_created_at ON product_events(event, created_at);
    CREATE INDEX IF NOT EXISTS product_events_session_id ON product_events(session_id) WHERE session_id IS NOT NULL;
  `);
  database.prepare("DELETE FROM product_events WHERE created_at < datetime('now', '-180 days')").run();
  return database;
}

export function createIosBetaSignup(input: SignupInput): { created: boolean } {
  const result = getSiteDatabase()
    .prepare(`
      INSERT INTO beta_signups (email, program, locale, source, created_at)
      VALUES (@email, 'ios-testflight', @locale, @source, @createdAt)
      ON CONFLICT(email, program) DO NOTHING
    `)
    .run({ ...input, createdAt: new Date().toISOString() });
  return { created: result.changes === 1 };
}

export function recordProductEvent(input: ProductEventInput): void {
  getSiteDatabase()
    .prepare(`
      INSERT OR IGNORE INTO product_events (
        event, event_id, session_id, locale, path, referrer_domain,
        utm_source, utm_medium, utm_campaign, device_type,
        method, platform, architecture, version, recommended, occurred_at, created_at
      )
      VALUES (
        @event, @eventId, @sessionId, @locale, @path, @referrerDomain,
        @utmSource, @utmMedium, @utmCampaign, @deviceType,
        @method, @platform, @architecture, @version, @recommended, @occurredAt, @createdAt
      )
    `)
    .run({
      event: input.event,
      eventId: input.eventId ?? null,
      sessionId: input.sessionId ?? null,
      locale: input.locale,
      path: input.path ?? null,
      referrerDomain: input.referrerDomain ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      deviceType: input.deviceType ?? null,
      method: input.method ?? null,
      platform: input.platform ?? null,
      architecture: input.architecture ?? null,
      version: input.version ?? null,
      recommended: input.recommended === undefined ? null : Number(input.recommended),
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
}
