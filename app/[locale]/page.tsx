import { notFound } from "next/navigation";

import { LandingPage } from "@/components/landing-page";
import { docBaseUrl, docUrl, isLocale, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params;
  if (!isLocale(loc)) notFound();
  const locale = loc as Locale;
  const messages = getMessages(locale);
  const docHome = docBaseUrl(locale);
  const docWorkflows = docUrl(locale, "workflows");

  return (
    <main className="flex-1">
      <LandingPage locale={locale} messages={messages} docHome={docHome} docWorkflows={docWorkflows} />
    </main>
  );
}
