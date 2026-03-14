// src/lib/redgifs/feed.ts

import { apiGetSafe } from "./client";
import type { StreamVideo, UserPreferences, FetchResult } from "./types";
import { getToken } from "./auth";

// Use real slugs from the niche list — only 1-2 boosts max
const GENDER_BOOST: Record<string, string[]> = {
  male:   ["big-ass"],
  female: ["dance"],
  all:    [],
};

const BLOCKED_NICHES = new Set<string>();

function computeScore(views: number, likes: number): number {
  if (views === 0 && likes === 0) return 0;
  const rate  = likes / (views + 1);
  const reach = Math.log10(views + 10);
  return rate * reach * 1000;
}

function isPortrait(gif: any): boolean {
  const w = gif.width || 0;
  const h = gif.height || 0;
  if (!w || !h) return true;
  return h / w >= 0.9;
}

function meetsQualityBar(gif: any): boolean {
  const views = gif.views || 0;
  const likes = gif.likes || 0;
  if (views === 0) return true;
  if (views < 500) return false;
  if (views > 100_000 && likes < 10) return false;
  return true;
}

function buildTitle(gif: any): string {
  const raw = gif.title?.trim();
  if (raw && raw.toLowerCase() !== "untitled" && raw.length > 2) return raw;
  const author = gif.username || gif.userName || "";
  return author ? `@${author}` : "Featured";
}

function mapGif(item: any, niche?: string): StreamVideo | null {
  const gif = item.gif || item;
  const id  = gif.id;
  if (!id) return null;
  if (!isPortrait(gif)) return null;
  if (!meetsQualityBar(gif)) return null;

  const views = gif.views || 0;
  const likes = gif.likes || 0;

  return {
    id: id.toString(),
    title: buildTitle(gif),
    author: gif.username || gif.userName || gif.author || "RedGIFs",
    authorAvatar: gif.userAvatar || gif.avatar || "",
    permalink: gif.urls?.web_url || `https://www.redgifs.com/watch/${id}`,
    videoUrl: `https://www.redgifs.com/ifr/${id}`,
    views,
    likes,
    score: computeScore(views, likes),
    tags: gif.tags || [],
    niche,
  };
}

async function fetchNicheBatch(slug: string, count: number, page: number): Promise<StreamVideo[]> {
  if (!BLOCKED_NICHES.has(slug)) {
    const data = await apiGetSafe(
      `/v2/niches/${encodeURIComponent(slug)}/gifs?count=${count}&order=trending&page=${page}`
    );
    if (data) {
      const gifs: any[] = data.gifs || data.results || data.items || [];
      if (gifs.length > 0) {
        return gifs.map((g) => mapGif(g, slug)).filter(Boolean) as StreamVideo[];
      }
    }
    // 403/404/410 → mark blocked, fall through to search
    BLOCKED_NICHES.add(slug);
  }

  // Search fallback using slug as keyword
  const searchData = await apiGetSafe(
    `/v2/gifs/search?search_text=${encodeURIComponent(slug.replace(/-/g, " "))}&count=${count}&order=trending&type=g&page=${page}`
  );
  if (!searchData) return [];
  const gifs: any[] = searchData.gifs || searchData.results || [];
  return gifs.map((g) => mapGif(g, slug)).filter(Boolean) as StreamVideo[];
}

function dedupe(videos: StreamVideo[], seen: Set<string>): StreamVideo[] {
  return videos.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
}

const PAGE_SIZE = 20;

export async function assembleFeed(
  prefs: UserPreferences,
  page: number,
  existingIds: string[]
): Promise<FetchResult> {
  await getToken();
  const seen = new Set<string>(existingIds);

  const boosts = (GENDER_BOOST[prefs.gender] || []).slice(0, 1);
  const allSlugs = [...new Set([...prefs.niches, ...boosts])];
  const shuffled = [...allSlugs].sort(() => Math.random() - 0.5);

  const batches = await Promise.all(
    shuffled.map((slug) => fetchNicheBatch(slug, 15, page))
  );

  const maxLen = Math.max(...batches.map((b) => b.length), 0);
  const interleaved: StreamVideo[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (const batch of batches) {
      if (batch[i]) interleaved.push(batch[i]);
    }
  }

  const unique = dedupe(interleaved, seen);
  unique.sort((a, b) => b.score - a.score);
  for (let i = 0; i < unique.length - 1; i += 2) {
    if (Math.random() > 0.55) [unique[i], unique[i + 1]] = [unique[i + 1], unique[i]];
  }

  const token = await getToken();
  return { videos: unique.slice(0, PAGE_SIZE), token, hasMore: unique.length >= PAGE_SIZE };
}