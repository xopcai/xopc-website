import {
  fetchLatestReleaseForPrefetch,
  getReleaseCacheRoot,
  isPrefetchCandidateName,
  warmAssetToDisk,
} from "@/lib/release-download-cache";

/** 服务启动后异步预热最新 release 的安装包缓存（不阻塞启动）。 */
export async function prefetchLatestReleaseToCache(): Promise<void> {
  if (!getReleaseCacheRoot()) return;

  const meta = await fetchLatestReleaseForPrefetch();
  if (!meta) return;

  for (const a of meta.assets) {
    if (!isPrefetchCandidateName(a.name)) continue;
    void warmAssetToDisk(meta.tag, a.name, a.browser_download_url).catch(() => {});
  }
}
