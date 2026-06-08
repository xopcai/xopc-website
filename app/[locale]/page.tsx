import { notFound } from "next/navigation";

import { LandingPage } from "@/components/landing-page";
import { getGithubRepoStats } from "@/lib/github-repo-stats";
import { getLatestReleasePayload } from "@/lib/get-latest-release-payload";
import { docBaseUrl, docUrl, isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params;
  if (!isLocale(loc)) notFound();
  const locale = loc as Locale;
  const messages = getMessages(locale);
  const docHome = docBaseUrl(locale);
  const docWorkflows = docUrl(locale, "workflows");

  const [release, repoStats] = await Promise.all([getLatestReleasePayload(), getGithubRepoStats()]);

  return (
    <main className="flex-1">
      <LandingPage
        locale={locale}
        messages={messages}
        docHome={docHome}
        docWorkflows={docWorkflows}
        githubStars={repoStats.ok ? repoStats.stars : null}
        releaseTag={release.ok ? release.tag : null}
      />
    </main>
  );
}
