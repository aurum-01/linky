// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.redgifs.com" },
      { protocol: "https", hostname: "redgifs.com" },
      { protocol: "https", hostname: "thumbs2.redgifs.com" },
      { protocol: "https", hostname: "thumbs4.redgifs.com" },
      { protocol: "https", hostname: "media.redgifs.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Permissions-Policy", value: "fullscreen=*" },
        ],
      },
    ];
  },

  // Allow the browser to call api.redgifs.com directly for the client token
  // without being blocked by same-origin restrictions in some environments
  async rewrites() {
    return [];
  },
};

export default nextConfig;