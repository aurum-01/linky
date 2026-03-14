// src/components/AdSlot.tsx
"use client";

import { useEffect, useRef } from "react";

// ─── EXOCLICK ZONE IDS ────────────────────────────────────────────────────
const INSTREAM_ZONE_ID       = "5872218";  // In-Stream Video
const RECOMMENDATION_ZONE_ID = "5872222";  // Recommendation Widget
// ──────────────────────────────────────────────────────────────────────────

// Note: ExoClick uses different class names per zone type:
// In-Stream:      eas6a97888e
// Recommendation: eas6a97888e20  ← has "20" suffix

interface Props {
  index: number;
}

export default function AdSlot({ index }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef    = useRef(false);

  // Even slots → in-stream video, odd slots → recommendation widget
  const isVideo = index % 2 === 0;

  useEffect(() => {
    if (!containerRef.current || loadedRef.current) return;
    loadedRef.current = true;

    if (isVideo) {
      injectInstreamAd(containerRef.current);
    } else {
      injectRecommendationAd(containerRef.current);
    }
  }, [isVideo]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <span className="text-white/40 text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          Sponsored
        </span>
      </div>
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
    </div>
  );
}

// ─── In-Stream Video ───────────────────────────────────────────────────────
function injectInstreamAd(container: HTMLDivElement) {
  const ins = document.createElement("ins");
  ins.className = "eas6a97888e";           // in-stream class
  ins.setAttribute("data-zoneid", INSTREAM_ZONE_ID);
  ins.style.cssText = "display:block;width:100%;height:100%;";
  container.appendChild(ins);

  loadScript("https://a.magsrv.com/ad-provider.js", () => {
    const w = window as any;
    (w.AdProvider = w.AdProvider || []).push({ serve: {} });
  });
}

// ─── Recommendation Widget ─────────────────────────────────────────────────
function injectRecommendationAd(container: HTMLDivElement) {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "width:100%;padding:8px;box-sizing:border-box;";

  const ins = document.createElement("ins");
  ins.className = "eas6a97888e20";         // recommendation class — note the "20"
  ins.setAttribute("data-zoneid", RECOMMENDATION_ZONE_ID);
  ins.style.cssText = "display:block;width:100%;";
  wrapper.appendChild(ins);

  loadScript("https://a.magsrv.com/ad-provider.js", () => {
    const w = window as any;
    (w.AdProvider = w.AdProvider || []).push({ serve: {} });
  });

  container.appendChild(wrapper);
}

// ─── Script loader (once globally) ────────────────────────────────────────
const _loaded = new Set<string>();

function loadScript(src: string, onLoad: () => void) {
  if (_loaded.has(src)) { onLoad(); return; }
  _loaded.add(src);
  const s = document.createElement("script");
  s.async = true;
  s.type  = "application/javascript";
  s.setAttribute("data-cfasync", "false");
  s.src = src;
  s.onload = onLoad;
  document.head.appendChild(s);
}