// src/components/AdSlot.tsx
"use client";

import { useEffect, useRef, useState } from "react";

const RECOMMENDATION_ZONE_ID = "5872222";
const VAST_PROXY_URL         = "/api/vast";

interface Props { index: number; }

export default function AdSlot({ index }: Props) {
  // Every 3rd slot attempts VAST video — falls back to rec widget if no fill
  const isVideoSlot = index % 3 === 0;

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <span className="text-white/40 text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          Sponsored
        </span>
      </div>

      {isVideoSlot ? (
        // Try VAST — if no fill, renders 2× recommendation widgets as fallback
        <VastOrFallback zoneId={RECOMMENDATION_ZONE_ID} index={index} />
      ) : (
        <TwoRecWidgets zoneId={RECOMMENDATION_ZONE_ID} index={index} />
      )}

      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-3 right-3 text-white/15 text-[10px] z-30 pointer-events-none">
          slot #{index} · {isVideoSlot ? "vast→rec" : "2×rec"}
        </div>
      )}
    </div>
  );
}

// ─── VAST with recommendation fallback ────────────────────────────────────
function VastOrFallback({ zoneId, index }: { zoneId: string; index: number }) {
  const [mode, setMode] = useState<"loading" | "video" | "fallback">("loading");
  const [vastData, setVastData] = useState<{ src: string; clickUrl: string } | null>(null);
  const [skippable, setSkippable] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [done, setDone] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function load() {
      try {
        const res = await fetch(VAST_PROXY_URL);
        if (!res.ok) throw new Error(`proxy ${res.status}`);
        const text = await res.text();

        const doc  = new DOMParser().parseFromString(text, "application/xml");
        const ads  = doc.querySelectorAll("Ad");

        if (ads.length === 0) {
          // No fill — show recommendation widgets instead of black screen
          setMode("fallback");
          return;
        }

        const files = Array.from(doc.querySelectorAll("MediaFile"));
        const mp4   = files.find(f => (f.getAttribute("type") || "").toLowerCase().includes("mp4")) || files[0];
        const src   = (mp4?.textContent || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();

        if (!src) { setMode("fallback"); return; }

        // Fire impressions
        if (!firedRef.current) {
          firedRef.current = true;
          doc.querySelectorAll("Impression").forEach(imp => {
            const url = (imp.textContent || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
            if (url) fetch(url).catch(() => {});
          });
        }

        const ct = doc.querySelector("ClickThrough");
        const clickUrl = ct ? (ct.textContent || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";

        setVastData({ src, clickUrl });
        setMode("video");

        timer = setInterval(() => {
          setCountdown(c => {
            if (c <= 1) { clearInterval(timer); setSkippable(true); return 0; }
            return c - 1;
          });
        }, 1000);

      } catch {
        setMode("fallback");
      }
    }

    load();
    return () => clearInterval(timer);
  }, []);

  // ── Loading ──
  if (mode === "loading") {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Fallback: recommendation widgets ──
  if (mode === "fallback" || done) {
    return <TwoRecWidgets zoneId={zoneId} index={index} />;
  }

  // ── Video ad ──
  return (
    <div
      className="relative w-full h-full bg-black cursor-pointer"
      onClick={() => vastData?.clickUrl && window.open(vastData.clickUrl, "_blank", "noopener")}
    >
      <video
        src={vastData?.src}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        onEnded={() => setDone(true)}
        onError={() => setMode("fallback")}
      />
      <div className="absolute bottom-6 right-4 z-20">
        {skippable ? (
          <button
            onClick={e => { e.stopPropagation(); setDone(true); }}
            className="bg-black/70 text-white text-xs px-3 py-1.5 rounded border border-white/30 hover:bg-white/20 transition"
          >
            Skip Ad ›
          </button>
        ) : (
          <div className="bg-black/60 text-white/60 text-xs px-3 py-1.5 rounded border border-white/20">
            Skip in {countdown}s
          </div>
        )}
      </div>
      <div className="absolute bottom-6 left-4 z-20 pointer-events-none">
        <span className="text-white/40 text-[10px] bg-black/50 px-2 py-0.5 rounded">Ad</span>
      </div>
    </div>
  );
}

// ─── Two recommendation widgets ────────────────────────────────────────────
function TwoRecWidgets({ zoneId, index }: { zoneId: string; index: number }) {
  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      <RecommendationWidget zoneId={zoneId} instanceId={`${index}-a`} />
      <RecommendationWidget zoneId={zoneId} instanceId={`${index}-b`} />
    </div>
  );
}

// ─── Single recommendation widget ─────────────────────────────────────────
function RecommendationWidget({ zoneId, instanceId }: { zoneId: string; instanceId: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!ref.current || loaded.current) return;
    loaded.current = true;

    const ins = document.createElement("ins");
    ins.className = "eas6a97888e20";
    ins.setAttribute("data-zoneid", zoneId);
    ins.style.cssText = "display:block;width:100%;";
    ref.current.appendChild(ins);

    loadScript("https://a.magsrv.com/ad-provider.js", () => {
      const w = window as any;
      (w.AdProvider = w.AdProvider || []).push({ serve: {} });
    });
  }, [zoneId, instanceId]);

  return (
    <div className="w-full flex-1 flex items-start justify-center py-4">
      <div ref={ref} className="w-full px-3" />
    </div>
  );
}

// ─── Script loader ─────────────────────────────────────────────────────────
const _loaded = new Set<string>();

function loadScript(src: string, onLoad: () => void) {
  if (_loaded.has(src)) { onLoad(); return; }
  _loaded.add(src);
  const s = document.createElement("script");
  s.async = true;
  s.type  = "application/javascript";
  s.setAttribute("data-cfasync", "false");
  s.src   = src;
  s.onload = onLoad;
  document.head.appendChild(s);
}