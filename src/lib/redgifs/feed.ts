// src/lib/redgifs/feed.ts
import { apiGetSafe } from "./client";
import type { StreamVideo, UserPreferences, FetchResult } from "./types";
import { getToken } from "./auth";

// ─── Niche priority weights ────────────────────────────────────────────────
const NICHE_WEIGHTS: Record<string, number> = {
  "desi":                  3,
  "indian-babes":          3,
  "indian-couples":        3,
  "indian-hotwife":        2.5,
  "indian-femdom":         2,
  "indian-sluts":          2.5,
  "sweet-hijabis":         2,
  "brown-sluts":           2,
  "kerala-babes":          2.5,
  "hot-pakistani-freaks":  2,
  "bangladeshi-milfs":     2,
  "mature-indian":         2,
  "real-indian-goddesses": 2.5,
  "latinas":               2,
  "latina-creampies":      2,
  "latina-hotwife":        2,
  "latina-milfs":          2,
  "brazil-prime":          1.5,
};

const GENDER_BOOST: Record<string, string[]> = {
  male:   ["desi", "big-ass", "twerk"],
  female: ["desi", "yoga", "fit-girls"],
  all:    ["desi", "latinas"],
};

const MAX_NICHE_SHARE = 0.30;
const BLOCKED_NICHES  = new Set<string>();
const PAGE_SIZE       = 20;

// ─── Engagement scoring with time decay ───────────────────────────────────
function computeScore(gif: any): number {
  const views = gif.views || 0;
  const likes = gif.likes || 0;
  if (views === 0 && likes === 0) return 0;

  const engagementRate = likes / (views + 1);
  const reachBonus     = Math.log10(views + 10);

  // Recency bonus
  let recencyBonus = 1.0;
  const dateStr = gif.published || gif.createDate || gif.date;
  if (dateStr) {
    const ageInDays = (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
    if (ageInDays < 7)        recencyBonus = 1.5;
    else if (ageInDays < 30)  recencyBonus = 1.25;
    else if (ageInDays < 90)  recencyBonus = 1.1;
  }

  // Quality penalty for bot-inflated content
  let qualityMod = 1.0;
  if (views > 50_000  && likes < 5)  qualityMod = 0.1;
  if (views > 100_000 && likes < 10 && views % 100_000 === 0) qualityMod = 0.2;

  return engagementRate * reachBonus * recencyBonus * qualityMod * 1000;
}

// ─── Quality filter ────────────────────────────────────────────────────────
function passesQualityBar(gif: any): boolean {
  const views    = gif.views    || 0;
  const likes    = gif.likes    || 0;
  const duration = gif.duration || 0;

  if (duration > 0 && duration < 2)           return false; // too short
  if (views > 0 && views < 300)               return false; // too obscure
  if (views > 100_000 && likes === 0)         return false; // bot-inflated
  if (views > 10_000  && likes < 3)           return false; // low engagement

  return true;
}

function isPortrait(gif: any): boolean {
  const w = gif.width || 0;
  const h = gif.height || 0;
  if (!w || !h) return true;
  return h / w >= 0.9;
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
  if (!id)                    return null;
  if (!isPortrait(gif))       return null;
  if (!passesQualityBar(gif)) return null;

  return {
    id:          id.toString(),
    title:       buildTitle(gif),
    author:      gif.username || gif.userName || gif.author || "RedGIFs",
    authorAvatar: gif.userAvatar || gif.avatar || "",
    permalink:   gif.urls?.web_url || `https://www.redgifs.com/watch/${id}`,
    videoUrl:    `https://www.redgifs.com/ifr/${id}`,
    views:       gif.views || 0,
    likes:       gif.likes || 0,
    score:       computeScore(gif),
    tags:        gif.tags || [],
    niche,
  };
}

// ─── Expanded keyword map for Indian/Desi niches ───────────────────────────
const SLUG_KEYWORDS: Record<string, string[]> = {
  "desi":                  ["desi indian", "desi girl", "indian desi"],
  "indian-babes":          ["indian babe", "india girl", "desi babe"],
  "indian-couples":        ["indian couple", "desi couple", "indian sex"],
  "indian-hotwife":        ["indian hotwife", "desi hotwife"],
  "indian-femdom":         ["indian femdom", "desi domina"],
  "indian-sluts":          ["indian slut", "desi slut"],
  "sweet-hijabis":         ["hijab", "hijabi girl", "desi hijab"],
  "brown-sluts":           ["brown girl", "desi brown", "south asian"],
  "kerala-babes":          ["kerala", "south indian", "malayali"],
  "hot-pakistani-freaks":  ["pakistani girl", "pak desi"],
  "bangladeshi-milfs":     ["bangladeshi", "bangla girl"],
  "mature-indian":         ["mature indian", "indian aunty", "desi aunty"],
  "real-indian-goddesses": ["real indian", "desi goddess"],
  "indian-celebrity-nsfw": ["indian celebrity", "bollywood"],
  "desi-cum":              ["desi cum", "indian cum"],
  "latinas":               ["latina", "latin girl"],
  "latina-creampies":      ["latina creampie"],
  "brazil-prime":          ["brazilian girl", "brasil"],
  "colombia":              ["colombiana", "colombia girl"],
  "mexican-girls":         ["mexican girl", "latina mexico"],
};

// ─── Multi-strategy fetch ──────────────────────────────────────────────────
async function fetchNicheBatch(
  slug: string,
  count: number,
  page: number
): Promise<StreamVideo[]> {
  const results: StreamVideo[] = [];

  // Strategy 1: dedicated niche endpoint (curated by RedGIFs)
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
    BLOCKED_NICHES.add(slug);
  }

  // Strategy 2 + 3: primary keyword + up to 2 extra keywords in parallel
  const keywords = SLUG_KEYWORDS[slug] || [slug.replace(/-/g, " ")];
  const searches = keywords.slice(0, 3).map((kw) =>
    apiGetSafe(
      `/v2/gifs/search?search_text=${encodeURIComponent(kw)}&count=${count}&order=trending&type=g&page=${page}`
    )
  );

  const responses = await Promise.all(searches);
  for (const data of responses) {
    if (!data) continue;
    const gifs: any[] = data.gifs || data.results || [];
    results.push(...(gifs.map((g) => mapGif(g, slug)).filter(Boolean) as StreamVideo[]));
  }

  return results.sort((a, b) => b.score - a.score);
}

// ─── Deduplication ─────────────────────────────────────────────────────────
function dedupe(videos: StreamVideo[], seen: Set<string>): StreamVideo[] {
  return videos.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
}

// ─── Weighted slot allocation ──────────────────────────────────────────────
function allocateSlots(slugs: string[], totalSlots: number): Map<string, number> {
  const weights = slugs.map((s) => NICHE_WEIGHTS[s] ?? 1);
  const totalW  = weights.reduce((a, b) => a + b, 0);
  const slots   = new Map<string, number>();

  slugs.forEach((slug, i) => {
    const raw    = (weights[i] / totalW) * totalSlots;
    const capped = Math.min(raw, totalSlots * MAX_NICHE_SHARE);
    slots.set(slug, Math.max(1, Math.round(capped)));
  });

  return slots;
}

// ─── Main assembler ────────────────────────────────────────────────────────
export async function assembleFeed(
  prefs: UserPreferences,
  page: number,
  existingIds: string[]
): Promise<FetchResult> {
  await getToken();
  const seen = new Set<string>(existingIds);

  const boosts   = GENDER_BOOST[prefs.gender] || [];
  const allSlugs = [...new Set([...prefs.niches, ...boosts])];
  const slotMap  = allocateSlots(allSlugs, PAGE_SIZE * 2);

  // Fetch all niches in parallel
  const batchResults = await Promise.all(
    allSlugs.map(async (slug) => {
      const count = Math.max(8, (slotMap.get(slug) || 1) * 2);
      return { slug, videos: await fetchNicheBatch(slug, count, page) };
    })
  );

  // Build weighted pool
  const pool: StreamVideo[] = [];
  for (const { slug, videos } of batchResults) {
    const slots = slotMap.get(slug) || 1;
    pool.push(...videos.sort((a, b) => b.score - a.score).slice(0, slots * 2));
  }

  // Dedup + sort by score
  const unique = dedupe(pool, seen);
  unique.sort((a, b) => b.score - a.score);

  // Soft shuffle
  for (let i = 0; i < unique.length - 1; i += 2) {
    if (Math.random() > 0.6) [unique[i], unique[i + 1]] = [unique[i + 1], unique[i]];
  }

  // Diversity cap — no single niche dominates
  const nicheCount  = new Map<string, number>();
  const maxPerNiche = Math.ceil(PAGE_SIZE * MAX_NICHE_SHARE);
  const final = unique.filter((v) => {
    if (!v.niche) return true;
    const c = nicheCount.get(v.niche) || 0;
    if (c >= maxPerNiche) return false;
    nicheCount.set(v.niche, c + 1);
    return true;
  });

  const token = await getToken();
  return { videos: final.slice(0, PAGE_SIZE), token, hasMore: unique.length >= PAGE_SIZE };
}