import "server-only";

export type IosDistribution =
  | { status: "accepting" }
  | { status: "paused" }
  | { status: "public" | "released"; url: string };

function httpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function iosDistribution(): IosDistribution {
  const configured = process.env.IOS_DISTRIBUTION_STATUS?.trim().toLowerCase();
  if (!configured) return { status: "accepting" };
  const status = configured;
  if (status === "paused") return { status };
  if (status === "public" || status === "released") {
    const url = httpUrl(process.env.IOS_DISTRIBUTION_URL?.trim());
    return url ? { status, url } : { status: "paused" };
  }
  return status === "accepting" ? { status } : { status: "paused" };
}

export function releasePublicBaseUrl(): string | null {
  const url = httpUrl(process.env.RELEASE_DOWNLOAD_PUBLIC_BASE_URL?.trim());
  return url ? url.replace(/\/$/, "") : null;
}
