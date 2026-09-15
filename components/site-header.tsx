import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { XopcLogoMark } from "@/components/xopc-logo-mark";
import { docBaseUrl, type Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
  active?: "home" | "learn" | "map";
  locationSuffix?: string;
};

export function SiteHeader({ locale, active, locationSuffix = "" }: Props) {
  const zh = locale === "zh";
  const links = [
    { id: "home", href: `/${locale}`, label: zh ? "概览" : "Overview" },
    {
      id: "learn",
      href: `/${locale}/learn`,
      label: zh ? "使用场景" : "In practice",
    },
    {
      id: "map",
      href: `/${locale}/product-map`,
      label: zh ? "产品地图" : "Product map",
    },
    { id: "docs", href: docBaseUrl(locale), label: zh ? "文档" : "Docs" },
  ];
  return (
    <header className="site-header">
      <a className="site-brand" href={`/${locale}`} aria-label="xopc">
        <XopcLogoMark />
        <span>xopc</span>
      </a>
      <nav
        className="site-navigation"
        aria-label={zh ? "主导航" : "Main navigation"}
      >
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            aria-current={active === link.id ? "page" : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div className="site-tools">
        <LocaleSwitcher
          locale={locale}
          labelZh="中文"
          labelEn="English"
          chooseLanguageLabel={zh ? "切换语言" : "Language"}
          variant="landing"
          locationSuffix={locationSuffix}
        />
        <ThemeToggle
          variant="pill"
          ariaLight={zh ? "浅色" : "Light"}
          ariaDark={zh ? "深色" : "Dark"}
          ariaToggle={zh ? "切换外观" : "Change appearance"}
        />
        <a className="site-download" href={`/${locale}#download`}>
          {zh ? "下载" : "Download"}
        </a>
      </div>
    </header>
  );
}
