// src/components/AdSlot.tsx
"use client";

import { useEffect, useRef, useState } from "react";

// ─── EXOCLICK ZONE IDS ────────────────────────────────────────────────────
const INSTREAM_ZONE_ID       = "5872218";  // In-Stream Video (VAST)
const RECOMMENDATION_ZONE_ID = "5872222";  // Recommendation Widget
// ──────────────────────────────────────────────────────────────────────────

// VAST URL for in-stream zone
const VAST_URL = `https://s.magsrv.com/v1/vast.php?idzone=${INSTREAM_ZONE_ID}`;

interface Props {
  index: number;
}

export default function AdSlot({ index }: Props) {
  // Even slots → VAST video player, odd slots → recommendation widget
  const isVideo = index % 2 === 0;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <span className="text-white/40 text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          Sponsored
        </span>
      </div>

      {isVideo ? (
        <VastPlayer vastUrl={VAST_URL} />
      ) : (
        <RecommendationWidget zoneId={RECOMMENDATION_ZONE_ID} />
      )}

      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-3 right-3 text-white/15 text-[10px] z-30">
          slot #{index} · {isVideo ? "vast" : "rec"}
        </div>
      )}
    </div>
  );
}

// ─── VAST Player ───────────────────────────────────────────────────────────
// Fetches the VAST XML, extracts the MediaFile URL, plays it in a <video>.
// Handles click-through, skip after 5s, and impression/tracking pixels.
function VastPlayer({ vastUrl }: { vastUrl: string }) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [src, setSrc]             = useState<string | null>(null);
  const [clickUrl, setClickUrl]   = useState<string>("");
  const [skippable, setSkippable] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [ended, setEnded]         = useState(false);
  const trackedRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function loadVast() {
      try {
        const res = await fetch(vastUrl);
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/xml");

        // Extract MediaFile URL (prefer MP4)
        const mediaFiles = Array.from(doc.querySelectorAll("MediaFile"));
        const mp4 = mediaFiles.find((m) =>
          (m.getAttribute("type") || "").includes("mp4")
        ) || mediaFiles[0];

        if (!mp4) return;
        const videoSrc = mp4.textContent?.trim().replace(/\s/g, "") || "";
        if (!videoSrc) return;

        setSrc(videoSrc);

        // Extract click-through
        const ct = doc.querySelector("ClickThrough");
        if (ct?.textContent) setClickUrl(ct.textContent.trim());

        // Fire impression pixels
        if (!trackedRef.current) {
          trackedRef.current = true;
          doc.querySelectorAll("Impression").forEach((imp) => {
            const url = imp.textContent?.trim();
            if (url) fetch(url).catch(() => {});
          });
        }

        // Countdown to skip
        timer = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(timer);
              setSkippable(true);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } catch {
        // VAST failed — slot shows nothing (acceptable)
      }
    }

    loadVast();
    return () => clearInterval(timer);
  }, [vastUrl]);

  function handleSkip() {
    if (!skippable) return;
    setEnded(true);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
  }

  function handleClick() {
    if (clickUrl) window.open(clickUrl, "_blank", "noopener");
  }

  if (ended || !src) {
    // After skip or before VAST loads — show neutral dark screen
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        {!src && (
          <div className="w-7 h-7 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black cursor-pointer" onClick={handleClick}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted={false}
        playsInline
        className="w-full h-full object-contain"
        onEnded={() => setEnded(true)}
      />

      {/* Skip button */}
      <div className="absolute bottom-6 right-4 z-20">
        {skippable ? (
          <button
            onClick={(e) => { e.stopPropagation(); handleSkip(); }}
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

      {/* Ad label bottom-left */}
      <div className="absolute bottom-6 left-4 z-20 pointer-events-none">
        <span className="text-white/40 text-[10px] bg-black/50 px-2 py-0.5 rounded">Ad</span>
      </div>
    </div>
  );
}

// ─── Recommendation Widget ─────────────────────────────────────────────────
// Uses ad-provider.js with the correct class "eas6a97888e20"
function RecommendationWidget({ zoneId }: { zoneId: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!ref.current || loaded.current) return;
    loaded.current = true;

    const ins = document.createElement("ins");
    ins.className = "eas6a97888e20";   // recommendation widget class
    ins.setAttribute("data-zoneid", zoneId);
    ins.style.cssText = "display:block;width:100%;";
    ref.current.appendChild(ins);

    loadScript("https://a.magsrv.com/ad-provider.js", () => {
      const w = window as any;
      (w.AdProvider = w.AdProvider || []).push({ serve: {} });
    });
  }, [zoneId]);

  return (
    <div className="w-full h-full flex items-start justify-center pt-8 overflow-y-auto">
      <div ref={ref} className="w-full px-4" />
    </div>
  );
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
  s.src   = src;
  s.onload = onLoad;
  document.head.appendChild(s);
}