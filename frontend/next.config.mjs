import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export", // Removed - incompatible with better-auth middleware
  // trailingSlash: true, // Removed - not needed without export
  // images: { unoptimized: true }, // Removed - not needed without export
  turbopack: {
    root: fileURLToPath(new URL("./", import.meta.url)),
  },
}

export default nextConfig
