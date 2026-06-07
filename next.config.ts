import type { NextConfig } from "next";

import { loadEnvFiles } from "./lib/load-env";

loadEnvFiles();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
