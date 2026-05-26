import type { NextConfig } from "next"
import path from "node:path"

const nextConfig: NextConfig = {
  turbopack: {
    // Avoid picking a parent directory when multiple lockfiles exist on the machine.
    root: path.join(__dirname),
  },
}

export default nextConfig
