// src/components/AdSlot.tsx
//
// ExoClick ad integration.
// Replace EXOCLICK_ZONE_ID with your actual zone ID from ExoClick dashboard.
// Docs: https://docs.exoclick.com/docs/developer-api/
//
// Recommended ExoClick ad format for a vertical video feed:
// - Format: Interstitial / In-Page Push / Native
// - Size: 300x500 or fullscreen interstitial
// Set up your zone at: https://publisher.exoclick.com

"use client";

import { useEffect, useRef } from "react";

// ─── CONFIGURE THESE ──────────────────────────────────────────────────────
const EXOCLICK_ZONE_ID = "YOUR_ZONE_ID"; // replace with real zone ID
const EXOCLICK_ENABLED = EXOCLICK_ZONE_ID !== "YOUR_ZONE_ID";
// ──────────────────────────────────────────────────────────────────────────

interface Props {
  index: number;
}

export default function AdSlot({ index }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!EXOCLICK_ENABLED || !containerRef.current) return;

    // ExoClick injects ad via script tag — load their SDK once
    const existingScript = document.getElementById("exoclick-sdk");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id    = "exoclick-sdk";
      script.async = true;
      script.src   = "https://a.exdynsrv.com/adframe.php";
      // ExoClick zone configuration
      (window as any).exoZone = EXOCLICK_ZONE_ID;
      document.head.appendChild(script);
    }

    // Render ad unit into our container
    if (containerRef.current) {
      containerRef.current.innerHTML = `
        <div id="exo-ad-${index}" 
             data-zone="${EXOCLICK_ZONE_ID}"
             style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">
        </div>
      `;
    }
  }, [index]);

  if (!EXOCLICK_ENABLED) {
    // Dev placeholder — shown until you configure ExoClick
    return (
      <div className="relative w-full h-full bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
        <div className="w-[85%] max-w-sm bg-zinc-900 border border-white/8 rounded-3xl p-8 flex flex-col items-center gap-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white text-xl font-bold">
            Ad
          </div>
          <div className="space-y-1.5">
            <p className="text-white font-semibold text-lg">Sponsored Content</p>
            <p className="text-white/30 text-sm leading-relaxed">
              Configure ExoClick zone ID in AdSlot.tsx to show real ads
            </p>
          </div>
          <a
            href="https://publisher.exoclick.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-black text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-white/90 transition active:scale-95"
          >
            Set up ExoClick →
          </a>
        </div>
        <div className="absolute top-4 left-4 z-10">
          <span className="text-white/30 text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            Sponsored
          </span>
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="absolute bottom-4 right-4 text-white/15 text-[10px]">ad #{index}</div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10">
        <span className="text-white/30 text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          Sponsored
        </span>
      </div>
    </div>
  );
}