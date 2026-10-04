import { Loopi } from "@/components/brand/loopi";

type Props = {
  brandName: string;
  headline: string;
  locale: 'en' | 'zh';
};

export function HeroBrand({ brandName, headline, locale }: Props) {
  return (
    <div className="hero-brand">
      <div className="hero-brand-logo-wrap">
        <div className="hero-brand-logo">
          <Loopi className="hero-companion" interactive cycle language={locale} />
        </div>
      </div>

      <div className="hero-wordmark" aria-label={brandName}>
        {brandName}
      </div>

      <h1 className="hero-headline">{headline}</h1>
    </div>
  );
}
