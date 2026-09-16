import {
  assertAllowedReleaseAssetName,
  assertAllowedReleaseTag,
  serveCachedReleaseDownload,
} from "@/lib/release-download-cache";
import { downloadEventDimensions } from "@/lib/download-event.server";
import { releasePublicBaseUrl } from "@/lib/distribution-config.server";
import { recordProductEvent, type SiteLocale } from "@/lib/site-database.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag") ?? "";
  const name = searchParams.get("name") ?? "";

  try {
    assertAllowedReleaseTag(tag);
    assertAllowedReleaseAssetName(name);
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const publicBaseUrl = releasePublicBaseUrl();
    const response = publicBaseUrl
      ? Response.redirect(`${publicBaseUrl}/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`, 307)
      : await serveCachedReleaseDownload(tag, name);
    const dimensions = response.status < 400 ? downloadEventDimensions(tag, name) : null;
    if (dimensions) {
      const locale: SiteLocale = searchParams.get("locale") === "en" ? "en" : "zh";
      recordProductEvent({ event: "download_started", locale, ...dimensions });
    }
    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "release_download_lock_timeout") {
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
