// src/lib/redgifs/types.ts

export interface StreamVideo {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  permalink: string;
  videoUrl: string;
  views: number;
  likes: number;
  score: number;
  tags: string[];
  niche?: string;
  isAd?: boolean;
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
  resetAt: number;
}