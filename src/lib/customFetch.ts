// Type definitions
export interface StreamVideo {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  permalink: string;
  videoUrl: string; 
  hdUrl: string;
  posterUrl: string;
  views: number;
  likes: number;
  tags: string[];
}

export interface RedgifsNiche {
  slug: string;
  name: string;
}

export interface UserPreferences {
  niches: string[];
  gender: "male" | "female" | "all";
}

export interface FetchResult {
  videos: StreamVideo[];
  token: string;
}

export interface RedgifsGifData {
  id: string;
  title?: string;
  username?: string;
  userName?: string;
  author?: string; // <-- Fixed TS Error here
  userAvatar?: string;
  avatar?: string;
  tags?: string[];
  views: number;
  likes: number;
  urls: {
    hd?: string;
    sd?: string;
    vhd?: string;
    vsd?: string;
    web_url?: string;
    poster?: string;
    thumbnail?: string;
  };
}

export interface RedgifsResponse {
  gifs?: RedgifsGifData[];
  results?: RedgifsGifData[];
  items?: RedgifsGifData[];
  [key: string]: unknown;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

let _token: string | null = null;
let _tokenExpiry = 0;

export async function obtainRedgifsToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token!;

  try {
    const res = await fetch("https://api.redgifs.com/v2/auth/temporary", {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.redgifs.com/",
        Origin: "https://www.redgifs.com",
      },
      cache: "no-store", // Prevents Next.js from caching the auth token
    });

    if (!res.ok) throw new Error(`RedGIFs auth failed: ${res.status}`);

    const json: { token?: string; access_token?: string; bearer?: string; expires_in?: number; expires?: number } = await res.json();
    const token = json.token || json.access_token || json.bearer;
    if (!token) throw new Error("No token in RedGIFs auth response");

    const expiresIn = json.expires_in || json.expires || 3600;
    _token = token;
    _tokenExpiry = Date.now() + expiresIn * 1000;
    return _token!;
  } catch (error) {
    console.error("Failed to obtain RedGIFs token:", error);
    throw error;
  }
}

function authHeaders(token: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Referer: "https://www.redgifs.com/",
    Origin: "https://www.redgifs.com",
  };
}

// ─── Dynamic Tag Generation ─────────────────────────────────────────────────

const FALLBACK_TAGS = ["dance", "spicy", "cute", "pov", "model", "aesthetic", "funny", "vibes", "trending"];

export async function fetchTrendingTags(gender: string): Promise<RedgifsNiche[]> {
  try {
    const token = await obtainRedgifsToken();
    
    let search = "trending";
    if (gender === "male") search = "girls";
    if (gender === "female") search = "guys";

    const url = `https://api.redgifs.com/v2/gifs/search?search_text=${search}&order=trending&count=15`;
    const res = await fetch(url, { 
      headers: authHeaders(token),
      cache: "no-store" // Prevents returning cached tags on refresh
    });
    
    if (!res.ok) throw new Error(`Search failed with status ${res.status}`);
    
    const data: RedgifsResponse = await res.json();
    const gifs: RedgifsGifData[] = data.gifs || data.results || [];
    
    const top3 = gifs.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
    
    const uniqueTags = new Set<string>();
    for (const gif of top3) {
      const tags: string[] = gif.tags || [];
      tags.forEach(t => uniqueTags.add(t.toLowerCase()));
    }

    for (const fallback of FALLBACK_TAGS) {
      if (uniqueTags.size >= 9) break;
      uniqueTags.add(fallback);
    }

    return Array.from(uniqueTags).slice(0, 9).map(slug => ({
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1)
    }));

  } catch (err) {
    console.error("fetchTrendingTags error:", err);
    return FALLBACK_TAGS.map(slug => ({ slug, name: slug.charAt(0).toUpperCase() + slug.slice(1) }));
  }
}

// ─── Fetch videos ───────────────────────────────────────────────────────────

function buildTitle(gif: RedgifsGifData, primaryTag: string): string {
  if (gif.title?.trim() && gif.title.trim().toLowerCase() !== "untitled") {
    return gif.title.trim();
  }
  
  const rawTags: string[] = gif.tags || [];
  const displayTags = [primaryTag.toLowerCase(), ...rawTags.filter(t => t.toLowerCase() !== primaryTag.toLowerCase())];
  
  if (displayTags.length > 0) {
    return displayTags.slice(0, 3).map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)).join(" · ");
  }
  
  const author = gif.username || gif.userName || "";
  return author ? `@${author}` : "Featured";
}

function mapGif(item: RedgifsGifData | { gif?: RedgifsGifData }, primaryTag: string): StreamVideo | null {
  const gif = ('gif' in item && item.gif) ? item.gif : item as RedgifsGifData;
  const id = gif.id;
  
  if (!id) return null;

  const hdUrl = gif.urls?.hd || gif.urls?.sd || gif.urls?.vhd || gif.urls?.vsd;
  if (!hdUrl) return null;

  const rawTags: string[] = gif.tags || [];
  const lowerPrimary = primaryTag.toLowerCase();
  const sortedTags = [lowerPrimary, ...rawTags.filter(t => t.toLowerCase() !== lowerPrimary)];

  return {
    id: id.toString(),
    title: buildTitle(gif, primaryTag),
    author: gif.username || gif.userName || gif.author || "RedGIFs",
    authorAvatar: gif.userAvatar || gif.avatar || "",
    permalink: gif.urls?.web_url || `https://www.redgifs.com/watch/${id}`,
    videoUrl: `https://www.redgifs.com/ifr/${id}`,
    hdUrl: hdUrl, 
    posterUrl: gif.urls?.poster || gif.urls?.thumbnail || "",
    views: gif.views || 0,
    likes: gif.likes || 0,
    tags: sortedTags,
  };
}

function calculateQualityScore(video: StreamVideo): number {
  const viewScore = Math.log10(video.views + 1) * 100;
  const likeScore = Math.log10(video.likes + 1) * 100;
  return viewScore * 0.6 + likeScore * 0.4;
}

async function fetchNicheBatch(
  token: string,
  slug: string,
  count: number,
  page: number
): Promise<StreamVideo[]> {
  const url = `https://api.redgifs.com/v2/gifs/search?search_text=${encodeURIComponent(slug)}&order=trending&count=${count}&page=${page}`;
  
  try {
    const res = await fetch(url, { 
      headers: authHeaders(token),
      cache: "no-store" // <-- CRITICAL: Stops Next.js from showing the same videos for different tags
    });
    
    if (!res.ok) {
      console.warn(`Fetch batch returned ${res.status} for tag: ${slug}`);
      return [];
    }
    
    const data: RedgifsResponse = await res.json();
    const gifs: RedgifsGifData[] = data.gifs || data.results || data.items || [];
    
    const mappedVideos = gifs.map(gif => mapGif(gif, slug)).filter(Boolean) as StreamVideo[];
    
    return mappedVideos.sort((a, b) => calculateQualityScore(b) - calculateQualityScore(a));
  } catch (err) {
    console.error(`Fetch batch failed for ${slug}:`, err);
    return [];
  }
}

function dedupe(videos: StreamVideo[], seen: Set<string>): StreamVideo[] {
  return videos.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
}

export async function fetchCustomVideos(
  prefs: UserPreferences,
  page: number = 1,
  existingIds: string[] = []
): Promise<FetchResult> {
  try {
    const token = await obtainRedgifsToken();
    const seen = new Set<string>(existingIds);

    const allSlugs = [...new Set(prefs.niches)];

    const batches = await Promise.all(
      allSlugs.map((slug) => fetchNicheBatch(token, slug, 25, page))
    );

    const interleaved: StreamVideo[] = [];
    const maxLen = Math.max(...batches.map((b) => b.length), 0);
    
    for (let i = 0; i < maxLen; i++) {
      for (const batch of batches) {
        if (batch[i]) interleaved.push(batch[i]);
      }
    }

    const unique = dedupe(interleaved, seen);
    const ranked = unique.sort((a, b) => calculateQualityScore(b) - calculateQualityScore(a));
    
    return { videos: ranked.slice(0, 25), token };
  } catch (err) {
    console.error("fetchCustomVideos error:", err);
    return { videos: [], token: "" };
  }
}