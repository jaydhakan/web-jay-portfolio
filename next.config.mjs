/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this project. A stray lockfile in the parent dir
  // (~/package-lock.json) otherwise makes Next infer the wrong root and warn.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
