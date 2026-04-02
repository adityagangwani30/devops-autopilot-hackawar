import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export", // Removed - incompatible with better-auth middleware
  // trailingSlash: true, // Removed - not needed without export
  // images: { unoptimized: true }, // Removed - not needed without export
  serverExternalPackages: ["neo4j", "better-sqlite3"],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.coffee$/,
      use: 'coffee-loader',
      type: 'javascript/auto'
    });
    return config;
  },
  turbopack: {
    root: fileURLToPath(new URL("./", import.meta.url)),
  },
}

export default nextConfig
