import { XopcLogoMark } from "@/components/xopc-logo-mark";

type Props = {
  brandName: string;
  headline: string;
};

export function HeroBrand({ brandName, headline }: Props) {
  return (
    <div className="hero-brand">
      <div className="hero-brand-logo-wrap">
        <div className="hero-brand-logo">
          <XopcLogoMark priority />
        </div>
      </div>

      <div className="hero-wordmark" aria-label={brandName}>
        {brandName}
      </div>

      <h1 className="hero-headline">{headline}</h1>
    </div>
  );
}
