import type { ReactNode } from "react";
import { Github, Star } from "lucide-react";

import { formatCompactCount } from "@/lib/format-count";
import type { Locale } from "@/lib/i18n/config";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";

type SocialProofCopy = {
  mit: string;
  openSource: string;
  stars: string;
  version: string;
  starsAria: string;
};

type Props = {
  locale: Locale;
  copy: SocialProofCopy;
  stars: number | null;
  versionTag: string | null;
};

export function LandingSocialProof({ locale, copy, stars, versionTag }: Props) {
  const items: { key: string; node: ReactNode }[] = [
    { key: "mit", node: <span className="social-proof-chip social-proof-chip--muted">{copy.mit}</span> },
    { key: "oss", node: <span className="social-proof-chip social-proof-chip--muted">{copy.openSource}</span> },
  ];

  if (stars !== null) {
    const formatted = formatCompactCount(stars, locale);
    items.push({
      key: "stars",
      node: (
        <a
          href={LANDING_GITHUB_REPO}
          className="social-proof-chip social-proof-chip--link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={copy.starsAria.replace("{count}", String(stars))}
        >
          <Star className="social-proof-ic" strokeWidth={1.75} aria-hidden />
          {copy.stars.replace("{count}", formatted)}
        </a>
      ),
    });
  }

  if (versionTag) {
    items.push({
      key: "version",
      node: (
        <a
          href={`${LANDING_GITHUB_REPO}/releases/latest`}
          className="social-proof-chip social-proof-chip--link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="social-proof-ic" strokeWidth={1.75} aria-hidden />
          {copy.version.replace("{tag}", versionTag)}
        </a>
      ),
    });
  }

  return (
    <div className="social-proof" aria-label={copy.openSource}>
      {items.map((item) => (
        <span key={item.key} className="social-proof-item">
          {item.node}
        </span>
      ))}
    </div>
  );
}
