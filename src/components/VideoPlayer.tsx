"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, Heart, Share2, Eye } from "lucide-react";
import { StreamVideo } from "@/lib/customFetch";

function formatCount(n: number): string {
  if (!n) return "";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

interface Props {
  video: StreamVideo;
  isActive: boolean;
  shouldLoad: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function VideoPlayer({ video, isActive, shouldLoad, isMuted, onToggleMute }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const buildSrc = useCallback(
    (autoplay: boolean, muted: boolean) =>
      `${video.videoUrl}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}&controls=0&loop=1`,
    [video.videoUrl]
  );

  // Sync React state directly to the iframe URL
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (isActive) {
      // If it's active, play it
      iframe.src = buildSrc(true, isMuted);
    } else if (shouldLoad) {
      // If it's nearby but not active, pause it and pre-load
      iframe.src = buildSrc(false, true);
    } else {
      // If it's far away, completely unload it from memory
      iframe.src = "about:blank";
    }
  }, [isActive, shouldLoad, isMuted, buildSrc]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!liked) setLiked(true);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 600);
  };

  if (!video?.videoUrl) return null;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      
      {/* Blurred background layer for non-9:16 content */}
      {video.posterUrl && (
        <img 
          src={video.posterUrl} 
          alt="background"
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
        />
      )}

      {/* RedGIFs Official Iframe. 
        Using iframe bypasses the 403 CDN Hotlink Protection.
        We scale it up to crop out their UI elements.
      */}
      <iframe
        ref={iframeRef}
        src="about:blank"
        allowFullScreen
        allow="autoplay; fullscreen"
        scrolling="no"
        style={{
          border: "none",
          position: "absolute",
          width: "140%",
          height: "118%",
          top: "-6%",
          left: "-20%",
          pointerEvents: "none", // Prevent iframe from stealing our double-tap clicks
        }}
      />

      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/80 via-black/20 to-transparent z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 pointer-events-none" />

      {/* User Interaction Layer */}
      <div 
        className="absolute inset-0 z-30 cursor-pointer" 
        onDoubleClick={handleDoubleClick}
      />

      {/* Double tap heart animation */}
      <div className={`absolute inset-0 z-40 pointer-events-none flex items-center justify-center transition-all duration-500 ease-out ${
          heartAnim ? 'opacity-100 scale-110' : 'opacity-0 scale-50'
        }`}>
        <Heart size={120} className="text-rose-500 fill-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]" />
      </div>

      {/* Video Info Data */}
      <div className="absolute bottom-8 left-4 right-24 z-30 pointer-events-none space-y-2">
        <div className="flex items-center gap-2">
          {video.authorAvatar ? (
            <img 
              src={video.authorAvatar} 
              alt={video.author}
              className="w-8 h-8 rounded-full border border-white/30 object-cover shrink-0" 
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {video.author.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-white font-semibold text-sm drop-shadow-lg truncate">@{video.author}</span>
        </div>

        <h2 className="text-white font-semibold text-[15px] leading-snug drop-shadow-lg line-clamp-2">{video.title}</h2>

        {video.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-white/70 text-xs bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {video.views > 0 && (
          <div className="flex items-center gap-1 text-white/40 text-xs">
            <Eye size={11} />
            <span>{formatCount(video.views)} views</span>
          </div>
        )}
      </div>

      {/* Side Action Buttons */}
      <div className="absolute right-3 bottom-10 flex flex-col gap-4 items-center z-40">
        <button onClick={() => setLiked((l) => !l)} className="flex flex-col items-center gap-1 cursor-pointer">
          <div className={`p-3 backdrop-blur-lg rounded-full border shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${liked ? "bg-rose-500/80 border-rose-400/50" : "bg-white/10 hover:bg-white/20 border-white/20"}`}>
            <Heart size={24} className={`drop-shadow-md ${liked ? "text-white fill-white" : "text-white"}`} />
          </div>
          {video.likes > 0 && (
            <span className="text-white/60 text-[11px] font-medium">{formatCount(video.likes + (liked ? 1 : 0))}</span>
          )}
        </button>

        <button onClick={onToggleMute} className="cursor-pointer">
          <div className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full border border-white/20 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95">
            {isMuted ? <VolumeX size={24} className="text-white" /> : <Volume2 size={24} className="text-white" />}
          </div>
        </button>

        <a href={video.permalink} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
          <div className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full border border-white/20 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95">
            <Share2 size={24} className="text-white" />
          </div>
        </a>
      </div>
    </div>
  );
}