import type { NextConfig } from "next";
const githubPages = process.env.GITHUB_PAGES === "true";
const basePath = githubPages
  ? (process.env.PAGES_BASE_PATH ?? "/obraflow")
  : "";
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  output: githubPages ? "export" : undefined,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  trailingSlash: githubPages,
  images: { unoptimized: githubPages },
};
export default config;
