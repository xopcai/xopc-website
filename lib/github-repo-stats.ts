import { GITHUB_REPO, githubApiHeaders } from "@/lib/release-download-cache";

export type GithubRepoStats =
  | { ok: true; stars: number }
  | { ok: false };

/** Cached GitHub repo metadata for landing social proof. */
export async function getGithubRepoStats(): Promise<GithubRepoStats> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: githubApiHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { ok: false };

    const data: unknown = await res.json();
    if (!data || typeof data !== "object") return { ok: false };

    const stars = (data as { stargazers_count?: unknown }).stargazers_count;
    if (typeof stars !== "number" || !Number.isFinite(stars) || stars < 0) {
      return { ok: false };
    }

    return { ok: true, stars };
  } catch {
    return { ok: false };
  }
}
