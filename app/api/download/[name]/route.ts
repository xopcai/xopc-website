import {
  assertAllowedReleaseAssetName,
  serveCachedDesktopReleaseDownload,
} from "@/lib/release-download-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  try {
    assertAllowedReleaseAssetName(name);
  } catch {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  try {
    return await serveCachedDesktopReleaseDownload(name);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "release_download_lock_timeout") {
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
