// ─── src/lib/redgifs/niches.ts ─────────────────────────────────────────────

import { apiGetSafe } from "./client";
import type { RedgifsNiche } from "./types";

// Cache niche list in memory for the server process lifetime
let _nichesCache: RedgifsNiche[] | null = null;

export async function fetchNiches(): Promise<RedgifsNiche[]> {
  if (_nichesCache) return _nichesCache;

  const data = await apiGetSafe("/v2/niches?count=60&order=trending");
  const items: any[] = data?.niches || data?.items || data?.results || [];

  if (items.length === 0) {
    _nichesCache = FALLBACK_NICHES;
    return FALLBACK_NICHES;
  }

  _nichesCache = items
    .map((n: any) => ({
      slug: n.slug || n.name?.toLowerCase().replace(/\s+/g, "-") || "",
      name: n.name || n.title || n.slug || "",
      description: n.description || "",
      coverUrl: n.coverUrl || n.cover || n.thumbnail || n.poster || "",
      gifCount: n.gifCount || n.gifs_count || 0,
    }))
    .filter((n) => n.slug && n.name) as RedgifsNiche[];

  return _nichesCache;
}

export const FALLBACK_NICHES: RedgifsNiche[] = [
  { slug: "booty",    name: "Booty",    description: "", coverUrl: "", gifCount: 0 },
  { slug: "busty",    name: "Busty",    description: "", coverUrl: "", gifCount: 0 },
  { slug: "tease",    name: "Tease",    description: "", coverUrl: "", gifCount: 0 },
  { slug: "amateur",  name: "Amateur",  description: "", coverUrl: "", gifCount: 0 },
  { slug: "twerk",    name: "Twerk",    description: "", coverUrl: "", gifCount: 0 },
  { slug: "yoga",     name: "Yoga",     description: "", coverUrl: "", gifCount: 0 },
  { slug: "bikini",   name: "Bikini",   description: "", coverUrl: "", gifCount: 0 },
  { slug: "cosplay",  name: "Cosplay",  description: "", coverUrl: "", gifCount: 0 },
  { slug: "gamer",    name: "Gamer",    description: "", coverUrl: "", gifCount: 0 },
  { slug: "kawaii",   name: "Kawaii",   description: "", coverUrl: "", gifCount: 0 },
  { slug: "dance",    name: "Dance",    description: "", coverUrl: "", gifCount: 0 },
  { slug: "beach",    name: "Beach",    description: "", coverUrl: "", gifCount: 0 },
  { slug: "selfie",   name: "Selfie",   description: "", coverUrl: "", gifCount: 0 },
  { slug: "makeup",   name: "Makeup",   description: "", coverUrl: "", gifCount: 0 },
  { slug: "glam",     name: "Glam",     description: "", coverUrl: "", gifCount: 0 },
  { slug: "gym",      name: "Gym",      description: "", coverUrl: "", gifCount: 0 },
  { slug: "couple",   name: "Couple",   description: "", coverUrl: "", gifCount: 0 },
  { slug: "lingerie", name: "Lingerie", description: "", coverUrl: "", gifCount: 0 },
  { slug: "pov",      name: "POV",      description: "", coverUrl: "", gifCount: 0 },
  { slug: "model",    name: "Model",    description: "", coverUrl: "", gifCount: 0 },
  { slug: "goth",     name: "Goth",     description: "", coverUrl: "", gifCount: 0 },
  { slug: "party",    name: "Party",    description: "", coverUrl: "", gifCount: 0 },
  { slug: "shower",   name: "Shower",   description: "", coverUrl: "", gifCount: 0 },
  { slug: "leather",  name: "Leather",  description: "", coverUrl: "", gifCount: 0 },
];

export const NICHE_EMOJI: Record<string, string> = {
  booty: "🍑", busty: "🍒", tease: "💋", voyeur: "👀", amateur: "📸",
  twerk: "💃", yoga: "🧘", bikini: "👙", goth: "🖤", cosplay: "🎭",
  gamer: "🎮", kawaii: "🎀", bunny: "🐰", thighs: "🧦", leather: "👢",
  dance: "🔥", mirror: "🪞", bedroom: "🛏️", shower: "🚿", bath: "🛁",
  beach: "🌴", sunset: "🌅", selfie: "📱", makeup: "💄", glam: "✨",
  street: "🧢", leggings: "👖", gym: "🏋️", shorts: "🩳", jacket: "🧥",
  couple: "👫", cute: "🧸", music: "🎶", party: "🪩", night: "🌙",
  luxury: "💎", vacation: "🏝️", pov: "🎥", model: "📷", lingerie: "👗",
  seduce: "💃", pride: "🌈", punk: "🧑‍🎤", softie: "🌸", lotion: "🧴",
};