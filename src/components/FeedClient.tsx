"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import VideoPlayer from "./VideoPlayer";
import { StreamVideo, UserPreferences } from "@/lib/customFetch";
import { Settings2 } from "lucide-react";

interface Props {
  videos: StreamVideo[];
  prefs: UserPreferences;
  onEditPrefs: () => void;
}

export default function FeedClient({ videos: initialVideos, prefs, onEditPrefs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  
  const [videos, setVideos] = useState<StreamVideo[]>(initialVideos);
  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(2);
  const [loading, setLoading] = useState(false);
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);
  
  const loadedIds = useRef<Set<string>>(new Set(initialVideos.map((v) => v.id)));

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        existingIds: [...loadedIds.current].join(","),
        niches: prefs.niches.join(","),
        gender: prefs.gender,
      });
      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      const newVideos: StreamVideo[] = (data.videos || []).filter(
        (v: StreamVideo) => !loadedIds.current.has(v.id)
      );
      newVideos.forEach((v) => loadedIds.current.add(v.id));
      setVideos((prev) => [...prev, ...newVideos]);
      setPage((p) => p + 1);
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, page, prefs]);

  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) {
        const index = Math.round(el.scrollTop / el.clientHeight);
        const clamped = Math.min(index, videos.length - 1);
        setActiveIndex(clamped);
        
        if (clamped >= videos.length - 5 && !loading) loadMore();
      }
      rafRef.current = null;
    });
  }, [videos.length, loading, loadMore]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  const dotStart = Math.max(0, activeIndex - 4);
  const dotEnd = Math.min(videos.length - 1, dotStart + 8);

  return (
    <main className="flex items-center justify-center min-h-[100dvh] bg-zinc-950 overflow-hidden relative">
      <button 
        onClick={onEditPrefs}
        className="lg:hidden absolute top-6 right-5 z-40 p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white shadow-lg transition-transform active:scale-95"
      >
        <Settings2 size={20} />
      </button>

      <div className="hidden lg:flex flex-col items-end justify-center pr-8 w-60 shrink-0 gap-5">
        <div className="text-right space-y-1">
          <p className="text-3xl font-bold text-white tracking-tight">linky</p>
          <p className="text-sm text-white/30">Trending for you</p>
        </div>
        <div className="h-px w-20 bg-white/10" />
        <div className="flex flex-wrap gap-2 justify-end">
          {prefs.niches.map((slug) => (
            <span key={slug} className="text-white/40 text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-full capitalize">
              {slug.replace(/-/g, " ")}
            </span>
          ))}
        </div>
        <button 
          onClick={onEditPrefs}
          className="mt-2 text-xs font-semibold bg-white text-black px-5 py-2.5 rounded-full hover:bg-white/80 transition-colors"
        >
          Change Feed Vibe
        </button>
      </div>

      <div className="relative shrink-0" style={{ width: "min(100vw, 420px)", height: "100dvh" }}>
        <div ref={scrollRef} className="w-full h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
          {videos.map((video, i) => (
            <div key={video.id} className="w-full shrink-0 relative" style={{ height: "100dvh", scrollSnapAlign: "start" }}>
              <VideoPlayer
                video={video}
                isActive={i === activeIndex} // Tells the video to Play/Pause
                shouldLoad={Math.abs(i - activeIndex) <= 2} // Keeps surrounding videos pre-loaded in memory
                isMuted={isGlobalMuted}
                onToggleMute={() => setIsGlobalMuted((prev) => !prev)}
              />
            </div>
          ))}

          {loading && (
            <div className="w-full shrink-0 flex items-center justify-center bg-black" style={{ height: "100dvh", scrollSnapAlign: "start" }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-white/30 text-xs tracking-widest uppercase">Loading more</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-30 pointer-events-none">
          {Array.from({ length: dotEnd - dotStart + 1 }, (_, i) => {
            const ri = dotStart + i;
            return (
              <div key={ri} className={`rounded-full transition-all duration-300 ${ri === activeIndex ? "w-1.5 h-5 bg-white" : "w-1 h-1 bg-white/25"}`} />
            );
          })}
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-start justify-center pl-8 w-60 shrink-0 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-52 space-y-3 backdrop-blur-md">
          <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Now playing</p>
          <p className="text-white text-sm font-semibold line-clamp-2 leading-snug">{videos[activeIndex]?.title || "—"}</p>
          <p className="text-white/40 text-xs">@{videos[activeIndex]?.author || "—"}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-52 space-y-2 backdrop-blur-md">
          <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Up next</p>
          {videos.slice(activeIndex + 1, activeIndex + 4).map((v, i) => (
            <p key={v.id} className="text-white/50 text-xs truncate">{i + 1}. {v.title}</p>
          ))}
        </div>
      </div>
    </main>
  );
}