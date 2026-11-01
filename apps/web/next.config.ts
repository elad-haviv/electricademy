import path from "node:path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(import.meta.dirname, "../..");

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  // MDX lessons/articles are read from /content at request time.
  outputFileTracingIncludes: { "/**": ["../../content/**/*"] },
  transpilePackages: [
    "@electricademy/auth",
    "@electricademy/calc",
    "@electricademy/content",
    "@electricademy/db",
    "@electricademy/sim-sdk",
    "@electricademy/ui",
  ],
  turbopack: { root: monorepoRoot },
  // Images are pre-optimized WebP in /public/images (see docs/ARCHITECTURE.md).
  images: { unoptimized: true },
};

export default config;
