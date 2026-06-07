/** 与 `release-download-cache` 中的 `GITHUB_REPO` 保持一致 */
export const XOPC_DESKTOP_GITHUB_REPO = "xopcai/xopc";

/**
 * 官网桌面安装包所对应的 GitHub release。
 *
 * - 未设置 `DESKTOP_RELEASE_TAG` 时默认使用 `v0.0.1`（避免误将较新的 GitHub Latest 当作正式版）。
 * - 设为 `latest` 时与 GitHub `releases/latest` 一致。
 * - 设为其它值时使用 `releases/tags/{tag}`。
 */
export function desktopReleaseTagOrLatest(): string | "latest" {
  const raw = process.env.DESKTOP_RELEASE_TAG?.trim();
  if (!raw) return "v0.0.1";
  if (raw.toLowerCase() === "latest") return "latest";
  return raw;
}

export function githubDesktopReleaseApiUrl(): string {
  const spec = desktopReleaseTagOrLatest();
  if (spec === "latest") {
    return `https://api.github.com/repos/${XOPC_DESKTOP_GITHUB_REPO}/releases/latest`;
  }
  return `https://api.github.com/repos/${XOPC_DESKTOP_GITHUB_REPO}/releases/tags/${encodeURIComponent(spec)}`;
}
