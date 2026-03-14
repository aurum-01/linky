// ─── src/lib/redgifs/types.ts ──────────────────────────────────────────────

export interface StreamVideo {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  permalink: string;
  videoUrl: string;      // always https://www.redgifs.com/ifr/{id}
  views: number;
  likes: number;
  score: number;         // pre-computed engagement score for ranking
  tags: string[];
  niche?: string;        // which niche this came from
  isAd?: boolean;        // reserved for ad slots
}

export interface RedgifsNiche {
  slug: string;
  name: string;
  description: string;
  coverUrl: string;
  gifCount: number;
}

export interface UserPreferences {
  niches: string[];
  gender: "male" | "female" | "all";
}

export interface FetchResult {
  videos: StreamVideo[];
  token: string;
  hasMore: boolean;
}

export interface RateLimitState {
  remaining: number;
  resetAt: number; // ms epoch
}