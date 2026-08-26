import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import type { ProductEventName } from "@/lib/product-events";

export type SiteLocale = "zh" | "en";

type SignupInput = {
  email: string;
  locale: SiteLocale;
  source: string;
};

type ProductEventInput = {
  event: ProductEventName;
  locale: SiteLocale;
  method?: string;
  platform?: string;
  architecture?: string;
  version?: string;
  recommended?: boolean;
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

function getDatabase(): Database.Database {
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
      locale TEXT NOT NULL CHECK (locale IN ('zh', 'en')),
      method TEXT,
      platform TEXT,
      architecture TEXT,
      version TEXT,
      recommended INTEGER CHECK (recommended IN (0, 1)),
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
  database.prepare("DELETE FROM product_events WHERE created_at < datetime('now', '-180 days')").run();
  return database;
}

export function createIosBetaSignup(input: SignupInput): { created: boolean } {
  const result = getDatabase()
    .prepare(`
      INSERT INTO beta_signups (email, program, locale, source, created_at)
      VALUES (@email, 'ios-testflight', @locale, @source, @createdAt)
      ON CONFLICT(email, program) DO NOTHING
    `)
    .run({ ...input, createdAt: new Date().toISOString() });
  return { created: result.changes === 1 };
}

export function recordProductEvent(input: ProductEventInput): void {
  getDatabase()
    .prepare(`
      INSERT INTO product_events (
        event, locale, method, platform, architecture, version, recommended, created_at
      )
      VALUES (
        @event, @locale, @method, @platform, @architecture, @version, @recommended, @createdAt
      )
    `)
    .run({
      event: input.event,
      locale: input.locale,
      method: input.method ?? null,
      platform: input.platform ?? null,
      architecture: input.architecture ?? null,
      version: input.version ?? null,
      recommended: input.recommended === undefined ? null : Number(input.recommended),
      createdAt: new Date().toISOString(),
    });
}
