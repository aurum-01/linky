// src/components/AdSlot.tsx
"use client";

import { useEffect, useRef, useState } from "react";

const RECOMMENDATION_ZONE_ID = "5872222";

// We proxy the VAST through our own API to avoid CORS
const VAST_PROXY_URL = "/api/vast";

interface Props {
  index: number;
}

export default function AdSlot({ index }: Props) {
  // Every 3rd slot (0, 3, 6…) → VAST video
  // All others → recommendation widget (2 per slot)
  const isVideo = index % 3 === 0;

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">

      {/* Sponsored label */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <span className="text-white/40 text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          Sponsored
        </span>
      </div>

      {isVideo ? (
        <VastPlayer />
      ) : (
        // Two recommendation widgets stacked — fills the full feed slot
        <div className="w-full h-full flex flex-col overflow-y-auto">
          <RecommendationWidget zoneId={RECOMMENDATION_ZONE_ID} instanceId={`${index}-a`} />
          <RecommendationWidget zoneId={RECOMMENDATION_ZONE_ID} instanceId={`${index}-b`} />
        </div>
      )}

      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-3 right-3 text-white/15 text-[10px] z-30 pointer-events-none">
          slot #{index} · {isVideo ? "vast" : "2×rec"}
        </div>
      )}
    </div>
  );
}

// ─── VAST Player ───────────────────────────────────────────────────────────
function VastPlayer() {
  const videoRef       = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"loading" | "playing" | "error" | "ended">("loading");
  const [src, setSrc]        = useState("");
  const [clickUrl, setClickUrl] = useState("");
  const [skippable, setSkippable] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const firedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function load() {
      try {
        // Fetch VAST through our proxy (avoids CORS)
        const res = await fetch(VAST_PROXY_URL);
        if (!res.ok) throw new Error(`proxy ${res.status}`);

        const text = await res.text();
        const doc  = new DOMParser().parseFromString(text, "text/xml");

        // Parse error check
        const parseErr = doc.querySelector("parsererror");
        if (parseErr) throw new Error("Invalid VAST XML");

        // Find best MediaFile (prefer MP4)
        const files = Array.from(doc.querySelectorAll("MediaFile"));
        const mp4   = files.find(f => (f.getAttribute("type") || "").includes("mp4"))
                   || files[0];

        const videoSrc = mp4?.textContent?.trim().replace(/\s/g, "");
        if (!videoSrc) throw new Error("No media file in VAST");

        setSrc(videoSrc);
        setState("playing");

        // Click-through
        const ct = doc.querySelector("ClickThrough");
        if (ct?.textContent) setClickUrl(ct.textContent.trim());

        // Fire impression pixels once
        if (!firedRef.current) {
          firedRef.current = true;
          doc.querySelectorAll("Impression").forEach(imp => {
            const url = imp.textContent?.trim();
            if (url) fetch(url).catch(() => {});
          });
        }

        // Skip countdown
        timer = setInterval(() => {
          setCountdown(c => {
            if (c <= 1) { clearInterval(timer); setSkippable(true); return 0; }
            return c - 1;
          });
        }, 1000);

      } catch (err) {
        console.warn("[VastPlayer]", err);
        setState("error");
      }
    }

    load();
    return () => clearInterval(timer);
  }, []);

  if (state === "error" || state === "ended") {
    return <div className="w-full h-full bg-black" />;
  }

  if (state === "loading") {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full bg-black cursor-pointer"
      onClick={() => clickUrl && window.open(clickUrl, "_blank", "noopener")}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        onEnded={() => setState("ended")}
        onError={() => setState("error")}
      />

      {/* Skip control */}
      <div className="absolute bottom-6 right-4 z-20">
        {skippable ? (
          <button
            onClick={e => { e.stopPropagation(); setState("ended"); }}
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

// ─── Recommendation Widget ─────────────────────────────────────────────────
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
  const s       = document.createElement("script");
  s.async       = true;
  s.type        = "application/javascript";
  s.setAttribute("data-cfasync", "false");
  s.src         = src;
  s.onload      = onLoad;
  document.head.appendChild(s);
}