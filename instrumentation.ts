export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_RELEASE_PREFETCH === "1") return;

  const { prefetchLatestReleaseToCache } = await import("@/lib/prefetch-latest-release");
  void prefetchLatestReleaseToCache().catch(() => {});
}
