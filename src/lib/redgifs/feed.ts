// src/lib/redgifs/feed.ts

import { apiGetSafe } from "./client";
import type { StreamVideo, UserPreferences, FetchResult } from "./types";
import { getToken } from "./auth";

const GENDER_BOOST: Record<string, string[]> = {
  male:   ["booty", "busty", "twerk", "lingerie", "pov"],
  female: ["cosplay", "glam", "makeup", "yoga", "dance"],
  all:    [],
};

// Slugs known to 403 with guest tokens (adult-gated niches).
// We fall back to search for these automatically but also track
// at runtime so we don't keep retrying.
const BLOCKED_NICHES = new Set<string>();

// ─── Engagement scoring ────────────────────────────────────────────────────

function computeScore(views: number, likes: number): number {
  if (views === 0 && likes === 0) return 0;
  const rate = likes / (views + 1);
  const reach = Math.log10(views + 10);
  return rate * reach * 1000;
}

// ─── Quality filters ───────────────────────────────────────────────────────

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
  if (views < 200) return false;
  if (views > 50_000 && likes === 0) return false;
  return true;
}

// ─── Mapper ────────────────────────────────────────────────────────────────

function mapGif(item: any, niche?: string): StreamVideo | null {
  const gif = item.gif || item;
  const id = gif.id;
  if (!id) return null;
  if (!isPortrait(gif)) return null;
  if (!meetsQualityBar(gif)) return null;

  const views: number = gif.views || 0;
  const likes: number = gif.likes || 0;

  let title = gif.title?.trim();
  if (!title || title.toLowerCase() === "untitled") {
    const tags: string[] = gif.tags || [];
    title = tags.length
      ? tags.slice(0, 3).map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)).join(" · ")
      : gif.username ? `@${gif.username}` : "Featured";
  }

  return {
    id: id.toString(),
    title,
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

// ─── Niche fetch with search fallback ─────────────────────────────────────

async function fetchNicheBatch(slug: string, count: number, page: number): Promise<StreamVideo[]> {
  // Skip slugs already known to be blocked
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
    // null means 403/404/410 — mark as blocked and fall through to search
    BLOCKED_NICHES.add(slug);
    console.log(`[redgifs] Niche "${slug}" blocked/empty — falling back to search`);
  }

  // Search fallback: use slug as search term with trending order
  const searchData = await apiGetSafe(
    `/v2/gifs/search?search_text=${encodeURIComponent(slug)}&count=${count}&order=trending&type=g&page=${page}`
  );
  if (!searchData) return [];
  const gifs: any[] = searchData.gifs || searchData.results || searchData.items || [];
  return gifs.map((g) => mapGif(g, slug)).filter(Boolean) as StreamVideo[];
}

// ─── Deduplication ─────────────────────────────────────────────────────────

export function dedupe(videos: StreamVideo[], seen: Set<string>): StreamVideo[] {
  return videos.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
}

// ─── Feed assembler ────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export async function assembleFeed(
  prefs: UserPreferences,
  page: number,
  existingIds: string[]
): Promise<FetchResult> {
  const token = await getToken();
  const seen = new Set<string>(existingIds);

  const boosts = GENDER_BOOST[prefs.gender] || [];
  const allSlugs = [...new Set([...prefs.niches, ...boosts])];
  const shuffled = allSlugs.sort(() => Math.random() - 0.5);

  // Fetch all in parallel — blocked niches auto-fall-back to search
  const batches = await Promise.all(
    shuffled.map((slug) => fetchNicheBatch(slug, 20, page))
  );

  // Interleave niches for variety
  const maxLen = Math.max(...batches.map((b) => b.length), 0);
  const interleaved: StreamVideo[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (const batch of batches) {
      if (batch[i]) interleaved.push(batch[i]);
    }
  }

  const unique = dedupe(interleaved, seen);

  // Sort by engagement score, then soft-shuffle adjacent pairs
  unique.sort((a, b) => b.score - a.score);
  for (let i = 0; i < unique.length - 1; i += 2) {
    if (Math.random() > 0.6) [unique[i], unique[i + 1]] = [unique[i + 1], unique[i]];
  }

  return {
    videos: unique.slice(0, PAGE_SIZE),
    token,
    hasMore: unique.length >= PAGE_SIZE,
  };
}