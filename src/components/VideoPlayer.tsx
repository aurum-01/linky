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
  isActive?: boolean;
}

function VideoPlayerInner({ video, isNext = false }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const iframeRef     = useRef<HTMLIFrameElement>(null);
  const visibleRef    = useRef(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked]     = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const errorCountRef = useRef(0);

  // No token in iframe URL — /ifr/ handles its own auth as a first-party embed.
  // Passing the server JWT breaks playback (valid_addr IP mismatch).
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

    if (isNext && !visibleRef.current) {
      iframe.src = buildSrc(false, true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible && !visibleRef.current) {
          visibleRef.current = true;
          errorCountRef.current = 0;
          if (iframeRef.current) iframeRef.current.src = buildSrc(true, isMuted);
        } else if (!nowVisible && visibleRef.current) {
          visibleRef.current = false;
          if (iframeRef.current) {
            iframeRef.current.src = isNext ? buildSrc(false, true) : "about:blank";
          }
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNext, buildSrc, iframeKey]);

  useEffect(() => {
    if (iframeKey > 0 && visibleRef.current && iframeRef.current) {
      iframeRef.current.src = buildSrc(true, isMuted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeKey]);

  // ── Audio fix ────────────────────────────────────────────────────────────
  //
  // Browser autoplay policy blocks audio unless the gesture originates
  // inside the iframe's own browsing context. We can't do that with
  // pointerEvents:none. The workaround:
  //
  // 1. On mute-button click, briefly re-enable pointerEvents on the iframe.
  // 2. Reload iframe src with muted=0 AND autoplay=1.
  //    Because the src change happens synchronously inside a click handler,
  //    Chrome/Safari propagate the user-gesture token to the new navigation,
  //    allowing audio playback.
  // 3. After 600ms (enough time for the iframe to load and start playing),
  //    restore pointerEvents:none so our overlay stays interactive.
  //
  const handleMute = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !visibleRef.current) {
      setIsMuted((p) => !p);
      return;
    }

    setIsMuted((prev) => {
      const next = !prev;

      // Step 1: allow pointer events so the browser treats this as
      // a user gesture on the iframe context
      iframe.style.pointerEvents = "auto";

      // Step 2: reload with new muted state — must happen synchronously
      // within the click event to carry the gesture token
      iframe.src = buildSrc(true, next);

      // Step 3: restore after iframe has loaded
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.style.pointerEvents = "none";
        }
      }, 800);

      return next;
    });
  }, [buildSrc]);

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
          pointerEvents: "none", // restored to this after mute toggle
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

        {/* Mute button — see handleMute above for audio fix explanation */}
        <button onClick={handleMute} className="cursor-pointer">
          <div className="p-2.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-md shadow-lg hover:bg-white/20 transition-all active:scale-90">
            {isMuted
              ? <VolumeX size={22} className="text-white" />
              : <Volume2 size={22} className="text-white" />
            }
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