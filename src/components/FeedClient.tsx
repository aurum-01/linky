// src/components/FeedClient.tsx
"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import VideoPlayer from "./VideoPlayer";
import AdSlot from "./AdSlot";
import { useFeed } from "@/hooks/useFeed";
import type { StreamVideo, UserPreferences } from "@/lib/redgifs/types";

const AD_EVERY = 6;

type FeedItem =
  | { type: "video"; video: StreamVideo; key: string }
  | { type: "ad"; adIndex: number; key: string };

function buildFeedItems(videos: StreamVideo[]): FeedItem[] {
  const items: FeedItem[] = [];
  let adCount = 0;
  videos.forEach((video, i) => {
    items.push({ type: "video", video, key: video.id });
    if ((i + 1) % AD_EVERY === 0) {
      items.push({ type: "ad", adIndex: adCount++, key: `ad-${adCount}` });
    }
  });
  return items;
}

interface Props {
  initialVideos: StreamVideo[];
  prefs: UserPreferences;
}

export default function FeedClient({ initialVideos, prefs }: Props) {
  const { videos, isLoadingMore, hasMore, loadMore } = useFeed({ initialVideos, prefs });

  const scrollRef = useRef<HTMLDivElement>(null);
  // activeIndex tracks position in feedItems (includes ad slots)
  const [activeIndex, setActiveIndex] = useState(0);

  const feedItems = useMemo(() => buildFeedItems(videos), [videos]);

  // Derive active video — always reflect latest state
  const activeItem  = feedItems[activeIndex];
  const activeVideo = activeItem?.type === "video" ? activeItem.video : null;

  // Up next: next 3 video items after active
  const upNext = useMemo(() =>
    feedItems
      .slice(activeIndex + 1)
      .filter((i): i is Extract<FeedItem, { type: "video" }> => i.type === "video")
      .slice(0, 3),
    [feedItems, activeIndex]
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const raw     = Math.round(el.scrollTop / el.clientHeight);
    const clamped = Math.min(raw, feedItems.length - 1);
    setActiveIndex(clamped);
    if (videos.length - raw <= 5 && !isLoadingMore && hasMore) loadMore();
  }, [feedItems.length, videos.length, isLoadingMore, hasMore, loadMore]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const dotStart = Math.max(0, activeIndex - 4);
  const dotEnd   = Math.min(feedItems.length - 1, dotStart + 8);

  return (
    <div className="flex items-stretch justify-center w-full h-[100dvh] bg-zinc-950">

      {/* ── Desktop left sidebar ── */}
      <aside className="hidden lg:flex flex-col items-end justify-center pr-8 w-60 shrink-0 gap-5 border-r border-white/5">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-white tracking-tight">linky</h1>
          <p className="text-[10px] text-white/25 uppercase tracking-widest mt-0.5">For you</p>
        </div>
        <div className="h-px w-16 bg-white/8" />
        <div className="flex flex-wrap gap-1.5 justify-end">
          {prefs.niches.map((slug) => (
            <span key={slug} className="text-white/35 text-[11px] bg-white/5 border border-white/8 px-2 py-0.5 rounded-full capitalize">
              {slug.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      </aside>

      {/* ── Feed column ── */}
      <div className="relative shrink-0 border-x border-white/5" style={{ width: "min(100vw, 430px)" }}>
        <div
          ref={scrollRef}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        >
          {feedItems.map((item, i) => (
            <div
              key={item.key}
              className="w-full shrink-0"
              style={{ height: "100dvh", scrollSnapAlign: "start" }}
            >
              {item.type === "ad" ? (
                <AdSlot index={item.adIndex} />
              ) : (
                <VideoPlayer
                  video={item.video}
                  isNext={
                    i === activeIndex + 1 ||
                    (feedItems[activeIndex + 1]?.type === "ad" && i === activeIndex + 2)
                  }
                />
              )}
            </div>
          ))}

          {isLoadingMore && (
            <div className="w-full shrink-0 flex items-center justify-center bg-black" style={{ height: "100dvh", scrollSnapAlign: "start" }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-white/30 text-[11px] tracking-widest uppercase">Loading more</p>
              </div>
            </div>
          )}
        </div>

        {/* Scroll progress dots */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5 pointer-events-none">
          {Array.from({ length: dotEnd - dotStart + 1 }, (_, i) => {
            const ri = dotStart + i;
            return (
              <div key={ri} className={`rounded-full transition-all duration-300 ${ri === activeIndex ? "w-[5px] h-5 bg-white" : "w-[3px] h-[3px] bg-white/20"}`} />
            );
          })}
        </div>
      </div>

      {/* ── Desktop right sidebar — reactive to activeIndex ── */}
      <aside className="hidden lg:flex flex-col items-start justify-center pl-8 w-60 shrink-0 gap-4 border-l border-white/5">

        {/* Now playing — updates on every scroll */}
        <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 w-52 space-y-2.5 transition-all duration-300">
          <p className="text-white/25 text-[10px] uppercase tracking-widest font-medium">Now playing</p>
          {activeVideo ? (
            <>
              <div className="flex items-center gap-2">
                {activeVideo.authorAvatar ? (
                  <img src={activeVideo.authorAvatar} alt={activeVideo.author} className="w-6 h-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {activeVideo.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="text-white/50 text-xs truncate">@{activeVideo.author}</p>
              </div>
              <p className="text-white text-sm font-semibold line-clamp-2 leading-snug">{activeVideo.title}</p>
              {activeVideo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {activeVideo.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-white/30 text-[10px] bg-white/5 px-1.5 py-0.5 rounded-full">#{t}</span>
                  ))}
                </div>
              )}
              {activeVideo.score > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <div className="h-[3px] bg-white/8 rounded-full flex-1">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, activeVideo.score / 5)}%` }} />
                  </div>
                  <span className="text-white/20 text-[10px]">score</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-white/20 text-xs">—</p>
          )}
        </div>

        {/* Up next — updates on every scroll */}
        <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 w-52 space-y-2">
          <p className="text-white/25 text-[10px] uppercase tracking-widest font-medium">Up next</p>
          {upNext.length > 0 ? upNext.map((item, i) => (
            <div key={item.key} className="flex items-start gap-2">
              <span className="text-white/20 text-[10px] mt-[2px] shrink-0">{i + 1}</span>
              <p className="text-white/40 text-xs truncate leading-snug">{item.video.title}</p>
            </div>
          )) : (
            <p className="text-white/20 text-xs">Loading…</p>
          )}
        </div>

        {/* Advertise */}
        <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 w-52 space-y-2">
          <p className="text-white/25 text-[10px] uppercase tracking-widest font-medium">Advertise</p>
          <p className="text-white/30 text-xs leading-relaxed">Place your brand in front of millions of viewers.</p>
          <a
            href="https://publisher.exoclick.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-white/50 text-[11px] border border-white/10 px-3 py-1 rounded-full hover:border-white/30 hover:text-white/80 transition"
          >
            Get in touch →
          </a>
        </div>

      </aside>
    </div>
  );
}