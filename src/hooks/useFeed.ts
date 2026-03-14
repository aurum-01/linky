// src/hooks/useFeed.ts
"use client";

import { useRef, useState, useCallback } from "react";
import type { StreamVideo, UserPreferences } from "@/lib/redgifs/types";

interface Options {
  initialVideos: StreamVideo[];
  prefs: UserPreferences;
}

interface Return {
  videos: StreamVideo[];
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export function useFeed({ initialVideos, prefs }: Options): Return {
  const [videos, setVideos]               = useState<StreamVideo[]>(initialVideos);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore]             = useState(true);
  const [page, setPage]                   = useState(2);
  const seenIds = useRef(new Set(initialVideos.map((v) => v.id)));

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        existingIds: [...seenIds.current].join(","),
        niches: prefs.niches.join(","),
        gender: prefs.gender,
      });
      const res = await fetch(`/api/videos?${params}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const incoming: StreamVideo[] = (data.videos || []).filter(
        (v: StreamVideo) => !seenIds.current.has(v.id)
      );
      incoming.forEach((v) => seenIds.current.add(v.id));
      setHasMore(data.hasMore ?? incoming.length > 0);
      setVideos((prev) => [...prev, ...incoming]);
      setPage((p) => p + 1);
    } catch (err) {
      console.error("[useFeed]", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, prefs]);

  return { videos, isLoadingMore, hasMore, loadMore };
}