// src/components/VideoPlayer.tsx
"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { Heart, Share2, VolumeX, Volume2, Eye } from "lucide-react";
import type { StreamVideo } from "@/lib/redgifs/types";

function fmt(n: number): string {
  if (!n) return "";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

interface Props {
  video: StreamVideo;
  isNext?: boolean;
}

function VideoPlayerInner({ video, isNext = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef    = useRef<HTMLIFrameElement>(null);
  const visibleRef   = useRef(false);
  const isMutedRef   = useRef(true); // ref mirrors state for sync access in handlers
  const [isMuted, _setIsMuted] = useState(true);
  const [liked, setLiked]      = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const errorCountRef = useRef(0);

  // Keep ref in sync with state
  const setIsMuted = useCallback((val: boolean) => {
    isMutedRef.current = val;
    _setIsMuted(val);
  }, []);

  const buildSrc = useCallback(
    (play: boolean, muted: boolean) =>
      `${video.videoUrl}?autoplay=${play ? 1 : 0}&muted=${muted ? 1 : 0}&controls=0&loop=1`,
    [video.videoUrl]
  );

  const handleIframeError = useCallback(() => {
    errorCountRef.current += 1;
    if (errorCountRef.current <= 2) setIframeKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const iframe    = iframeRef.current;
    if (!container || !iframe) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible && !visibleRef.current) {
          visibleRef.current = true;
          errorCountRef.current = 0;
          // Use ref (not state) so closure always reads current value
          if (iframeRef.current) {
            iframeRef.current.src = buildSrc(true, isMutedRef.current);
          }
        } else if (!nowVisible && visibleRef.current) {
          visibleRef.current = false;
          // Always blank — prevents audio bleed from background iframes
          if (iframeRef.current) iframeRef.current.src = "about:blank";
        }
      },
      { threshold: 0.55 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [buildSrc, iframeKey]);

  useEffect(() => {
    if (iframeKey > 0 && visibleRef.current && iframeRef.current) {
      iframeRef.current.src = buildSrc(true, isMutedRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeKey]);

  // ─── Audio fix ────────────────────────────────────────────────────────────
  //
  // Root cause of audio not working:
  //   iframe.src was assigned inside setIsMuted(callback) — React batches
  //   state updates and runs the callback asynchronously, AFTER the browser's
  //   user-gesture token has expired. Cross-origin iframes require the src
  //   change to happen synchronously within the click event to inherit the
  //   gesture and allow audio playback.
  //
  // Fix:
  //   1. Compute `next` synchronously using the ref (not state)
  //   2. Assign iframe.src SYNCHRONOUSLY before any setState call
  //   3. Enable pointerEvents so the browser links this navigation to the
  //      user gesture on the parent frame
  //   4. Call setState after — order doesn't matter for audio at that point
  //
  const handleMute = useCallback((e: React.MouseEvent) => {
    // Must be synchronous — do NOT put this inside any async/setState callback
    const next = !isMutedRef.current;  // compute next value from ref, not state

    const iframe = iframeRef.current;
    if (iframe && visibleRef.current) {
      // Step 1: enable pointer events so browser ties src change to this gesture
      iframe.style.pointerEvents = "auto";

      // Step 2: assign src SYNCHRONOUSLY while user gesture is still active
      iframe.src = buildSrc(true, next);

      // Step 3: restore pointer events after iframe has loaded (~800ms)
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.style.pointerEvents = "none";
        }
      }, 800);
    }

    // Step 4: update state — happens after gesture token, fine for UI only
    setIsMuted(next);
  }, [buildSrc, setIsMuted]);

  if (!video?.videoUrl) return null;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">

      <iframe
        key={iframeKey}
        ref={iframeRef}
        src="about:blank"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media"
        scrolling="no"
        title={video.title}
        onError={handleIframeError}
        style={{
          border: "none",
          position: "absolute",
          width: "142%",
          height: "120%",
          top: "-7%",
          left: "-21%",
          pointerEvents: "none",
        }}
      />

      {/* Gradients */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none" />

      {/* Bottom info */}
      <div className="absolute bottom-8 left-4 right-16 z-20 pointer-events-none space-y-1.5">
        <div className="flex items-center gap-2">
          {video.authorAvatar ? (
            <img src={video.authorAvatar} alt={video.author} className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {video.author.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-white text-[13px] font-semibold drop-shadow truncate">@{video.author}</span>
          {video.niche && (
            <span className="text-white/50 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full shrink-0 capitalize border border-white/10">
              {video.niche.replace(/-/g, " ")}
            </span>
          )}
        </div>

        <p className="text-white text-[14px] font-medium leading-snug line-clamp-2 drop-shadow">{video.title}</p>

        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-white/60 text-[11px] bg-white/10 backdrop-blur-sm px-2 py-[2px] rounded-full border border-white/10">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {video.views > 0 && (
          <div className="flex items-center gap-1 text-white/40 text-[11px]">
            <Eye size={10} /><span>{fmt(video.views)} views</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="absolute right-2.5 bottom-10 z-20 flex flex-col items-center gap-4">

        <button onClick={() => setLiked((l) => !l)} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <div className={`p-2.5 rounded-full border backdrop-blur-md shadow-lg transition-all duration-150 active:scale-90 ${liked ? "bg-rose-500 border-rose-400" : "bg-white/10 border-white/15 hover:bg-white/20"}`}>
            <Heart size={22} className={liked ? "text-white fill-white" : "text-white"} />
          </div>
          {video.likes > 0 && (
            <span className="text-white/60 text-[10px] font-medium">{fmt(video.likes + (liked ? 1 : 0))}</span>
          )}
        </button>

        {/* Mute button — onClick must stay as a direct handler, never async */}
        <button onClick={handleMute} className="cursor-pointer">
          <div className="p-2.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-md shadow-lg hover:bg-white/20 transition-all active:scale-90">
            {isMuted ? <VolumeX size={22} className="text-white" /> : <Volume2 size={22} className="text-white" />}
          </div>
        </button>

        <a href={video.permalink} target="_blank" rel="noopener noreferrer">
          <div className="p-2.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-md shadow-lg hover:bg-white/20 transition-all active:scale-90">
            <Share2 size={22} className="text-white" />
          </div>
        </a>

      </div>
    </div>
  );
}

export default memo(VideoPlayerInner, (prev, next) =>
  prev.video.id === next.video.id && prev.isNext === next.isNext
);