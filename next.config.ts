import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["thread-stream", "pino", "pino-pretty"],
  transpilePackages: ["@privy-io/react-auth"],
  // Empty turbopack config to enable turbopack builds
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Handle WalletConnect/Reown dependencies
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Handle @reverbia/sdk's transformers dependency (Node.js modules in browser)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
