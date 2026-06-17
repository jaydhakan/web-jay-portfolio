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
};

export default nextConfig;
