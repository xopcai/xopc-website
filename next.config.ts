import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFiles } from "./lib/load-env";

loadEnvFiles();

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:locale(zh|en)/mobile",
        destination: "/:locale#mobile-download",
        permanent: true,
      },
      {
        source: "/:locale(zh|en)/products/:product(desktop|terminal|gateway|operator|worker|code|work)",
        destination: "/:locale#download",
        permanent: true,
      },
    ];
  },
  experimental: {
    cpus: 1,
  },
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingExcludes: {
    "/*": ["./next.config.ts"],
  },
};

export default nextConfig;
