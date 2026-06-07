import { NextResponse } from "next/server";

import { notifyWaitlistSignup } from "@/lib/telegram-waitlist-notify";
import { readWaitlist, writeWaitlist } from "@/lib/waitlist-store";

export const runtime = "nodejs";

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  return email;
}

export async function POST(req: Request) {
  let json: { email?: unknown };
  try {
    json = (await req.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = normalizeEmail(json.email);
  if (!email) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const waitlist = await readWaitlist();
  if (waitlist.some((e) => e.email === email)) {
    return NextResponse.json({ success: true, message: "Already joined", count: waitlist.length });
  }

  waitlist.push({ email, joinedAt: new Date().toISOString() });
  await writeWaitlist(waitlist);
  await notifyWaitlistSignup(email);

  return NextResponse.json({ success: true, count: waitlist.length });
}
