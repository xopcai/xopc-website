import { XopcLogoMark } from "@/components/xopc-logo-mark";

type Props = {
  brandName: string;
  headlineLine1: string;
  headlineLine2: string;
};

export function HeroBrand({ brandName, headlineLine1, headlineLine2 }: Props) {
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

      <h1 className="hero-headline">
        <span className="hero-headline-line1">{headlineLine1}</span>
        <span className="hero-headline-line2">{headlineLine2}</span>
      </h1>
    </div>
  );
}
