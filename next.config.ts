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
          // Allow fullscreen for RedGIFs iframes
          { key: "Permissions-Policy", value: "fullscreen=*" },
          // Loosen CSP to allow ExoClick ad scripts and iframes
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: ExoClick ad servers
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.magsrv.com *.exdynsrv.com *.exoclick.com *.exoclk.com",
              // Frames: RedGIFs embeds + ExoClick ad iframes
              "frame-src 'self' www.redgifs.com redgifs.com *.redgifs.com *.exoclick.com *.exdynsrv.com",
              // Images from ExoClick CDN
              "img-src 'self' data: blob: * ",
              // Connections: API calls + ExoClick tracking
              "connect-src 'self' * ",
              // Styles
              "style-src 'self' 'unsafe-inline'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;