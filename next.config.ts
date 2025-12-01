import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["thread-stream", "pino", "pino-pretty"],
  transpilePackages: ["@privy-io/react-auth"],
  // Empty turbopack config to enable turbopack builds
  turbopack: {},
  webpack: (config) => {
    // Handle WalletConnect/Reown dependencies
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
