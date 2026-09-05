import path from "node:path";
import type { NextConfig } from "next";

// Vercel builds and serves Next.js natively; `standalone` output is only for
// Docker / Railway (see /Dockerfile). Enabling it on Vercel breaks file tracing
// (ENOENT next-server.js.nft.json).
const onVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  transpilePackages: ["@wmc/shared"],
  ...(onVercel
    ? {}
    : {
        output: "standalone" as const,
        // Monorepo root, so the standalone build includes packages/shared.
        outputFileTracingRoot: path.join(__dirname, "../.."),
      }),
};

export default nextConfig;
