import type { NextConfig } from "next";

/**
 * GitHub Pages serves this project from https://USERNAME.github.io/askqueen/,
 * so production builds for Pages need the /askqueen base path. Local
 * development (`npm run dev`) and plain `npm run build` stay at the root.
 *
 * Set GITHUB_PAGES=true to build for Pages. Override the repo name with
 * PAGES_BASE_PATH (e.g. "/my-fork") if the repository is renamed.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? (process.env.PAGES_BASE_PATH ?? "/askqueen") : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: {
    // GitHub Pages has no image optimization server.
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
