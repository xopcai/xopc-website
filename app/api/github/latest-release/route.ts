import { NextResponse } from "next/server";

import type { LatestReleasePayload } from "@/lib/github-latest-release";
import { fetchLatestReleaseForPrefetch } from "@/lib/release-download-cache";

export type { LatestReleasePayload } from "@/lib/github-latest-release";

export async function GET() {
  try {
    const meta = await fetchLatestReleaseForPrefetch();
    if (!meta) {
      return NextResponse.json({ ok: false } satisfies LatestReleasePayload, { status: 502 });
    }

    const body: LatestReleasePayload = {
      ok: true,
      tag: meta.tag,
      assets: meta.assets.map((a) => ({
        name: a.name,
        url: `/api/download/release?tag=${encodeURIComponent(meta.tag)}&name=${encodeURIComponent(a.name)}`,
      })),
    };

    return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return NextResponse.json({ ok: false } satisfies LatestReleasePayload, { status: 502 });
  }
}
