import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.redgifs.com" },
      { protocol: "https", hostname: "redgifs.com" },
      // CDN edge nodes — avatar and niche cover images are served from here
      { protocol: "https", hostname: "thumbs2.redgifs.com" },
      { protocol: "https", hostname: "thumbs4.redgifs.com" },
      { protocol: "https", hostname: "media.redgifs.com" },
    ],
  },

  // Silence the "Allow attribute will take precedence over allowfullscreen"
  // warning that comes from the iframe in VideoPlayer
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "fullscreen=*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;