// src/components/AdSlot.tsx
"use client";

import { useEffect, useRef, useState } from "react";

const RECOMMENDATION_ZONE_ID = "5872222";
const VAST_PROXY_URL         = "/api/vast";

interface Props { index: number; }

export default function AdSlot({ index }: Props) {
  const isVideo = index % 3 === 0;

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <span className="text-white/40 text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          Sponsored
        </span>
      </div>

      {isVideo ? (
        <VastPlayer />
      ) : (
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

// ─── VAST Parser ───────────────────────────────────────────────────────────
// Extracts text from a node, stripping CDATA wrappers
function nodeText(el: Element | null): string {
  if (!el) return "";
  return (el.textContent || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

// ─── VAST Player ───────────────────────────────────────────────────────────
function VastPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "done">("loading");
  const [src, setSrc]           = useState("");
  const [clickUrl, setClickUrl] = useState("");
  const [skippable, setSkippable] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const firedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function load() {
      try {
        const res = await fetch(VAST_PROXY_URL);
        if (!res.ok) throw new Error(`proxy ${res.status}`);
        const text = await res.text();

        // Log trimmed XML for debugging
        console.log("[VastPlayer] XML:", text.slice(0, 800));

        const doc = new DOMParser().parseFromString(text, "application/xml");

        // Check for empty VAST (no fill)
        const ads = doc.querySelectorAll("Ad");
        if (ads.length === 0) {
          console.warn("[VastPlayer] No Ad elements — no fill");
          setStatus("done"); // hide slot silently
          return;
        }

        // Try all possible MediaFile selectors
        // VAST 2/3/4 differ in nesting: Linear > MediaFiles > MediaFile
        const allMediaFiles = Array.from(doc.querySelectorAll("MediaFile"));
        console.log("[VastPlayer] MediaFile count:", allMediaFiles.length);
        allMediaFiles.forEach((m, i) => {
          console.log(`[VastPlayer] MediaFile[${i}] type=${m.getAttribute("type")} text="${nodeText(m).slice(0, 80)}"`);
        });

        // Prefer MP4, fall back to first available
        const mp4 = allMediaFiles.find(m =>
          (m.getAttribute("type") || "").toLowerCase().includes("mp4")
        ) || allMediaFiles[0];

        const videoSrc = nodeText(mp4);
        if (!videoSrc) {
          console.warn("[VastPlayer] MediaFile found but URL is empty");
          setStatus("error");
          return;
        }

        setSrc(videoSrc);
        setStatus("ready");

        // Click-through
        const ct = doc.querySelector("ClickThrough");
        if (ct) setClickUrl(nodeText(ct));

        // Fire impression pixels
        if (!firedRef.current) {
          firedRef.current = true;
          doc.querySelectorAll("Impression").forEach(imp => {
            const url = nodeText(imp);
            if (url) fetch(url).catch(() => {});
          });
        }

        // Countdown
        timer = setInterval(() => {
          setCountdown(c => {
            if (c <= 1) { clearInterval(timer); setSkippable(true); return 0; }
            return c - 1;
          });
        }, 1000);

      } catch (err: any) {
        console.warn("[VastPlayer] Error:", err?.message);
        setStatus("error");
      }
    }

    load();
    return () => clearInterval(timer);
  }, []);

  if (status === "error" || status === "done") {
    return <div className="w-full h-full bg-black" />;
  }

  if (status === "loading") {
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
        onEnded={() => setStatus("done")}
        onError={() => setStatus("error")}
      />

      <div className="absolute bottom-6 right-4 z-20">
        {skippable ? (
          <button
            onClick={e => { e.stopPropagation(); setStatus("done"); }}
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
  const s = document.createElement("script");
  s.async = true;
  s.type  = "application/javascript";
  s.setAttribute("data-cfasync", "false");
  s.src   = src;
  s.onload = onLoad;
  document.head.appendChild(s);
}