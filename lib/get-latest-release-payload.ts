import type { LatestReleasePayload } from "@/lib/github-latest-release";
import { fetchLatestReleaseForPrefetch } from "@/lib/release-download-cache";

/** Build client/API payload from release cache (SSR + route handler). */
export async function getLatestReleasePayload(): Promise<LatestReleasePayload> {
  try {
    const meta = await fetchLatestReleaseForPrefetch();
    if (!meta) {
      return { ok: false };
    }

    return {
      ok: true,
      tag: meta.tag,
      assets: meta.assets.map((a) => ({
        name: a.name,
        url: `/api/download/release?tag=${encodeURIComponent(meta.tag)}&name=${encodeURIComponent(a.name)}`,
      })),
    };
  } catch {
    return { ok: false };
  }
}
