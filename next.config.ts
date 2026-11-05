import type { NextConfig } from "next";
const githubPages = process.env.GITHUB_PAGES === "true";
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  output: githubPages ? "export" : undefined,
  basePath: githubPages ? process.env.PAGES_BASE_PATH ?? "/obraflow" : "",
  trailingSlash: githubPages,
  images: { unoptimized: githubPages },
};
export default config;
