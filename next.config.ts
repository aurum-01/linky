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
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: ExoClick ad servers
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.magsrv.com *.exdynsrv.com *.exoclick.com *.exoclk.com",
              // Frames: RedGIFs + ExoClick
              "frame-src 'self' www.redgifs.com *.redgifs.com *.exoclick.com *.exdynsrv.com *.magsrv.com",
              // Images
              "img-src 'self' data: blob: *",
              // Connections
              "connect-src 'self' *",
              // Styles
              "style-src 'self' 'unsafe-inline'",
              // Media: ExoClick video CDN (afcdn.net) + any other ad CDNs
              "media-src 'self' blob: *.afcdn.net *.magsrv.com *.exoclick.com *.exdynsrv.com *",
              // Fonts
              "font-src 'self' data: *",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;