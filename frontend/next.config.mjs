import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable hybrid rendering - API routes work in dev and can be serverless in prod
  // Change back to output: "export" only if you need static-only hosting (no API routes)
  // output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: fileURLToPath(new URL("./", import.meta.url)),
  },
}

export default nextConfig
