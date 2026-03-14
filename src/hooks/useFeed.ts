// ─── src/hooks/useFeed.ts ──────────────────────────────────────────────────
//
// Manages the full feed lifecycle:
//  - Initial videos + token from server
//  - Infinite scroll (load more on approach to end)
//  - Client-side deduplication
//  - Loading / error states

"use client";

import { useRef, useState, useCallback } from "react";
import type { StreamVideo, UserPreferences } from "@/lib/redgifs/types";

const PREFETCH_THRESHOLD = 5; // load more when this many videos remain

interface UseFeedOptions {
  initialVideos: StreamVideo[];
  initialToken: string;
  prefs: UserPreferences;
}

interface UseFeedReturn {
  videos: StreamVideo[];
  token: string;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export function useFeed({ initialVideos, initialToken, prefs }: UseFeedOptions): UseFeedReturn {
  const [videos, setVideos] = useState<StreamVideo[]>(initialVideos);
  const [token, setToken] = useState(initialToken);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(2);

  // Persistent Set across renders — tracks all IDs ever loaded
  const seenIds = useRef<Set<string>>(new Set(initialVideos.map((v) => v.id)));

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
      if (!res.ok) throw new Error(`API ${res.status}`);

      const data = await res.json();
      const incoming: StreamVideo[] = (data.videos || []).filter(
        (v: StreamVideo) => !seenIds.current.has(v.id)
      );

      incoming.forEach((v) => seenIds.current.add(v.id));

      if (data.token) setToken(data.token);
      setHasMore(data.hasMore ?? incoming.length > 0);
      setVideos((prev) => [...prev, ...incoming]);
      setPage((p) => p + 1);
    } catch (err) {
      console.error("[useFeed] loadMore failed:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, prefs]);

  return { videos, token, isLoadingMore, hasMore, loadMore };
}