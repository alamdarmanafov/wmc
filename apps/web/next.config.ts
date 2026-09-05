import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@wmc/shared"],
  // Self-contained server bundle for Docker / Railway deployments.
  output: "standalone",
  // Monorepo root, so the standalone build includes packages/shared.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
