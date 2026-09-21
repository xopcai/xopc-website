import type { Locale } from "@/lib/i18n/config";
import { productIntro } from "@/lib/product-intro";

export function ProductIntroVideo({ locale, preload = "none" }: {
  locale: Locale;
  preload?: "none" | "metadata";
}) {
  const film = productIntro(locale);
  return (
    <video key={locale} width={1920} height={1080} controls playsInline
      preload={preload} poster={film.poster} aria-label={film.title}>
      <source src={film.video} type="video/mp4" />
      <track kind="captions" src={film.captions} srcLang={film.language} label={film.captionLabel} />
      {film.title}
    </video>
  );
}
