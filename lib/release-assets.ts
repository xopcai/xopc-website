export type ReleaseAsset = { name: string; url: string };

export function pickFirstMatching(
  assets: ReleaseAsset[],
  predicate: (name: string) => boolean,
  preferredSuffix?: string,
): ReleaseAsset | undefined {
  const hits = assets.filter((a) => predicate(a.name));
  if (hits.length === 0) return undefined;
  if (preferredSuffix) {
    const lower = preferredSuffix.toLowerCase();
    const preferred = hits.find((a) => a.name.toLowerCase().endsWith(lower));
    if (preferred) return preferred;
  }
  return hits[0];
}

/** 与桌面安装包发布文件名规则一致 */
export const assetPickers = {
  macArm64: (assets: ReleaseAsset[]) =>
    pickFirstMatching(assets, (n) => /-arm64\.(dmg|zip)$/i.test(n), ".dmg"),
  macX64: (assets: ReleaseAsset[]) =>
    pickFirstMatching(assets, (n) => /-x64\.(dmg|zip)$/i.test(n), ".dmg"),
  winX64: (assets: ReleaseAsset[]) =>
    pickFirstMatching(assets, (n) => /-x64\.exe$/i.test(n)) ??
    pickFirstMatching(assets, (n) => /^xopc\.exe$/i.test(n)),
  winArm64: (assets: ReleaseAsset[]) => pickFirstMatching(assets, (n) => /-arm64\.exe$/i.test(n)),
  linuxX64AppImage: (assets: ReleaseAsset[]) => {
    const hits = assets.filter((a) => /-(x64|x86_64)\.AppImage$/i.test(a.name));
    if (hits.length === 0) return undefined;
    return (
      hits.find((a) => a.name.toLowerCase().endsWith("x86_64.appimage")) ??
      hits.find((a) => a.name.toLowerCase().endsWith("x64.appimage")) ??
      hits[0]
    );
  },
  linuxX64Deb: (assets: ReleaseAsset[]) => {
    const hits = assets.filter((a) => /-(x64|amd64)\.deb$/i.test(a.name));
    if (hits.length === 0) return undefined;
    return (
      hits.find((a) => a.name.toLowerCase().endsWith("amd64.deb")) ??
      hits.find((a) => a.name.toLowerCase().endsWith("x64.deb")) ??
      hits[0]
    );
  },
  linuxArm64AppImage: (assets: ReleaseAsset[]) =>
    pickFirstMatching(assets, (n) => /-arm64\.AppImage$/i.test(n)),
} as const;
