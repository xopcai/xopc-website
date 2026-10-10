import { XopcLogoMark } from "@/components/xopc-logo-mark";
import type { Messages } from "@/lib/i18n/messages";
import {
  LANDING_GITHUB_ISSUES,
  LANDING_GITHUB_LICENSE,
  LANDING_GITHUB_REPO,
} from "@/lib/landing-urls";

type Props = {
  footer: Messages["landing"]["footer"];
  docsHref: string;
  locale: "zh" | "en";
};

export function LandingFooter({ footer, docsHref, locale }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="container footer-inner">
        <div className="footer-logo" aria-label="xopc">
          <XopcLogoMark />
        </div>
        <div className="footer-link-groups">
        <section className="footer-link-group" aria-label={locale === "zh" ? "探索与学习" : "Explore & learn"}>
          <h2>{locale === "zh" ? "探索与学习" : "Explore & learn"}</h2>
          <ul className="footer-links">
            <li><a href={`/${locale}/ada`}>Ada</a></li>
            <li><a href={`/${locale}/product-map`}>{locale === "zh" ? "产品探索" : "Product explorer"}</a></li>
            <li><a href={`/${locale}/learn`}>{locale === "zh" ? "实战教程" : "Tutorials"}</a></li>
            <li><a href={docsHref} target="_blank" rel="noopener noreferrer">{footer.docs}</a></li>
            <li><a href={`/${locale}/blog`}>{locale === "zh" ? "技术博客" : "Blog"}</a></li>
          </ul>
        </section>
        <section className="footer-link-group" aria-label={locale === "zh" ? "支持与社区" : "Support & community"}>
        <h2>{locale === "zh" ? "支持与社区" : "Support & community"}</h2>
        <ul className="footer-links">
          <li>
            <a href={LANDING_GITHUB_REPO} target="_blank" rel="noopener noreferrer">
              {footer.github}
            </a>
          </li>
          <li>
            <a href={`/${locale}#mobile-download`}>
              {footer.mobileApp}
            </a>
          </li>
          <li>
            <a href={LANDING_GITHUB_LICENSE} target="_blank" rel="noopener noreferrer">
              {footer.license}
            </a>
          </li>
          <li>
            <a href={LANDING_GITHUB_ISSUES} target="_blank" rel="noopener noreferrer">
              {footer.issues}
            </a>
          </li>
          <li><a href={`/${locale}/privacy`}>{footer.privacy}</a></li>
          <li><a href={`/${locale}/support`}>{footer.support}</a></li>
        </ul>
        </section>
        </div>
        <div className="footer-copy">{footer.copyright.replace("{year}", String(year))}</div>
      </div>
    </footer>
  );
}
