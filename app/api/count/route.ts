import { NextResponse } from "next/server";

import { readWaitlist } from "@/lib/waitlist-store";

export const runtime = "nodejs";

export async function GET() {
  const waitlist = await readWaitlist();
  return NextResponse.json({ count: waitlist.length });
}
