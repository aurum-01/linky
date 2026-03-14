// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "linky — Your Feed",
  description: "Personalised trending video feed",
  // ExoClick site verification meta tag
  other: {
    "exo-verification": "050a62095b82472cdd389ed6348660e8",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="font-[var(--font-geist)] antialiased">{children}</body>
    </html>
  );
}