import { isDownloadPlatform } from "@/lib/download-resolution";
import { resolveDownload } from "@/lib/download-resolver.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const platform = searchParams.get("platform");
  const locale = searchParams.get("locale") === "en" ? "en" : "zh";
  if (!isDownloadPlatform(platform)) {
    return Response.json({ error: "invalid_platform" }, { status: 400 });
  }

  try {
    const result = await resolveDownload(platform, locale);
    return Response.json(result, {
      status: result.ok ? 200 : 503,
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch {
    return Response.json(
      { ok: false, platform, status: "unavailable" },
      { status: 503 },
    );
  }
}
