/** Shared with `app/api/github/latest-release/route` and client download UI. */
export type LatestReleasePayload =
  | { ok: true; tag: string; assets: { name: string; url: string }[] }
  | { ok: false };
