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
  token: string;
  isNext?: boolean;
}

function VideoPlayerInner({ video, token, isNext = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef    = useRef<HTMLIFrameElement>(null);
  const visibleRef   = useRef(false);

  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked]     = useState(false);
  // Key increments to force iframe remount after chrome-error state
  const [iframeKey, setIframeKey] = useState(0);
  const errorCountRef = useRef(0);

  const buildSrc = useCallback(
    (play: boolean, muted: boolean) =>
      `${video.videoUrl}?autoplay=${play ? 1 : 0}&muted=${muted ? 1 : 0}&controls=0&loop=1${token ? `&token=${encodeURIComponent(token)}` : ""}`,
    [video.videoUrl, token]
  );

  // When the iframe enters an error state (chrome-error://) we must
  // remount it entirely — you cannot navigate away from chrome-error via JS.
  const handleIframeError = useCallback(() => {
    errorCountRef.current += 1;
    if (errorCountRef.current <= 3) {
      // Force remount by changing key
      setIframeKey((k) => k + 1);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const iframe    = iframeRef.current;
    if (!container || !iframe) return;

    if (isNext) {
      // Preload silently — autoplay=0 so it doesn't start playing
      iframe.src = buildSrc(false, true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;

        if (nowVisible && !visibleRef.current) {
          visibleRef.current = true;
          // Reset error count when video becomes active
          errorCountRef.current = 0;
          if (iframeRef.current) {
            iframeRef.current.src = buildSrc(true, isMuted);
          }
        } else if (!nowVisible && visibleRef.current) {
          visibleRef.current = false;
          if (iframeRef.current) {
            iframeRef.current.src = isNext ? buildSrc(false, true) : "about:blank";
          }
        }
      },
      { threshold: 0.55 }
    );

    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNext, buildSrc, iframeKey]); // iframeKey in deps ensures observer re-attaches after remount

  // After remount due to error, re-trigger play if still visible
  useEffect(() => {
    if (iframeKey > 0 && visibleRef.current && iframeRef.current) {
      iframeRef.current.src = buildSrc(true, isMuted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeKey]);

  const handleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (visibleRef.current && iframeRef.current) {
        iframeRef.current.src = buildSrc(true, next);
      }
      return next;
    });
  }, [buildSrc]);

  if (!video?.videoUrl) return null;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">

      {/*
        Iframe is oversized (142% × 120%) and offset so RedGIFs'
        own chrome (bottom bar, logo, side buttons) is clipped by
        overflow:hidden on the parent. pointerEvents:none keeps our
        overlay fully interactive.

        key={iframeKey} forces a full DOM remount when the iframe
        enters chrome-error:// state, which cannot be recovered from
        via src assignment.
      */}
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
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/75 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none" />

      {/* Bottom-left: author + title + tags + views */}
      <div className="absolute bottom-8 left-4 right-[4.5rem] z-20 pointer-events-none space-y-1.5">
        <div className="flex items-center gap-2">
          {video.authorAvatar ? (
            <img
              src={video.authorAvatar}
              alt={video.author}
              className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {video.author.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-white text-[13px] font-semibold drop-shadow truncate">
            @{video.author}
          </span>
          {video.niche && (
            <span className="text-white/50 text-[11px] bg-white/10 px-1.5 py-0.5 rounded-full shrink-0 capitalize">
              {video.niche}
            </span>
          )}
        </div>

        <p className="text-white text-[14px] font-medium leading-snug line-clamp-2 drop-shadow">
          {video.title}
        </p>

        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-white/60 text-[11px] bg-white/10 backdrop-blur-sm px-2 py-[2px] rounded-full border border-white/10"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {video.views > 0 && (
          <div className="flex items-center gap-1 text-white/40 text-[11px]">
            <Eye size={10} />
            <span>{fmt(video.views)}</span>
          </div>
        )}
      </div>

      {/* Right action bar */}
      <div className="absolute right-2.5 bottom-10 z-20 flex flex-col items-center gap-4">

        <button
          onClick={() => setLiked((l) => !l)}
          aria-label="Like"
          className="flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <div className={`p-2.5 rounded-full border backdrop-blur-md shadow-lg transition-all duration-150 active:scale-90 ${liked ? "bg-rose-500 border-rose-400" : "bg-white/10 border-white/15 hover:bg-white/20"}`}>
            <Heart size={22} className={liked ? "text-white fill-white" : "text-white"} />
          </div>
          {video.likes > 0 && (
            <span className="text-white/60 text-[10px] font-medium">{fmt(video.likes + (liked ? 1 : 0))}</span>
          )}
        </button>

        <button onClick={handleMute} aria-label={isMuted ? "Unmute" : "Mute"} className="cursor-pointer">
          <div className="p-2.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-md shadow-lg hover:bg-white/20 transition-all duration-150 active:scale-90">
            {isMuted ? <VolumeX size={22} className="text-white" /> : <Volume2 size={22} className="text-white" />}
          </div>
        </button>

        <a
          href={video.permalink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open on RedGIFs"
          className="cursor-pointer"
        >
          <div className="p-2.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-md shadow-lg hover:bg-white/20 transition-all duration-150 active:scale-90">
            <Share2 size={22} className="text-white" />
          </div>
        </a>

      </div>
    </div>
  );
}

export default memo(VideoPlayerInner, (prev, next) =>
  prev.video.id === next.video.id &&
  prev.token === next.token &&
  prev.isNext === next.isNext
);