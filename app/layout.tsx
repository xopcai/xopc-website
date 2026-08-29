import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://xopc.ai"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
