import {
  assertAllowedReleaseAssetName,
  assertAllowedReleaseTag,
  serveCachedReleaseDownload,
} from "@/lib/release-download-cache";

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
    return await serveCachedReleaseDownload(tag, name);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "release_download_lock_timeout") {
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
