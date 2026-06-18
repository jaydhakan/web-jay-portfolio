/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this project. A stray lockfile in the parent dir
  // (~/package-lock.json) otherwise makes Next infer the wrong root and warn.
  turbopack: {
    root: import.meta.dirname,
  },
  // Emit a minimal self-contained server (server.js + only the deps it traces)
  // under .next/standalone, so the Docker image ships without node_modules.
  output: "standalone",
  images: {
    // Serve modern formats (AVIF first, WebP fallback) — meaningfully smaller
    // covers/portraits than the default WebP-only behavior. (E5)
    formats: ["image/avif", "image/webp"],
    // Allowlist the one quality the site uses (next/image's default). Explicit so
    // a stray high-quality request can't balloon a cover; bump the list to tune.
    qualities: [75],
  },
};

export default nextConfig;
