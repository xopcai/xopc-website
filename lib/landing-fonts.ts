import { IBM_Plex_Sans } from "next/font/google";

/** Display face for landing headings — Latin via IBM Plex, CJK via system fallbacks in CSS. */
export const landingDisplayFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});
