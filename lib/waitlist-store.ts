import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type WaitlistEntry = { email: string; joinedAt: string };

const DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "waitlist.json");

function isEntry(x: unknown): x is WaitlistEntry {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.email === "string" && typeof o.joinedAt === "string";
}

export async function readWaitlist(): Promise<WaitlistEntry[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry);
  } catch {
    return [];
  }
}

export async function writeWaitlist(entries: WaitlistEntry[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
}
