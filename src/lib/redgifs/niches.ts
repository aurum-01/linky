// src/lib/redgifs/niches.ts
import { apiGetSafe } from "./client";
import type { RedgifsNiche } from "./types";

let _nichesCache: RedgifsNiche[] | null = null;

export async function fetchNiches(): Promise<RedgifsNiche[]> {
  if (_nichesCache) return _nichesCache;

  const data = await apiGetSafe("/v2/niches?count=80&order=trending");
  const items: any[] = data?.niches || data?.items || data?.results || [];

  if (items.length === 0) {
    _nichesCache = FALLBACK_NICHES;
    return FALLBACK_NICHES;
  }

  _nichesCache = items
    .map((n: any) => ({
      slug: n.slug || n.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "",
      name: n.name || n.title || n.slug || "",
      description: n.description || "",
      coverUrl: n.coverUrl || n.cover || n.thumbnail || n.poster || "",
      gifCount: n.gifCount || n.gifs_count || 0,
    }))
    .filter((n) => n.slug && n.name) as RedgifsNiche[];

  return _nichesCache;
}

// ─── Niche list ─────────────────────────────────────────────────────────────
// Grouped by category — Indian/Desi first, then Latina, then global top niches.
export const FALLBACK_NICHES: RedgifsNiche[] = [

  // ── Indian / Desi ──
  { slug: "desi",                  name: "Desi",               description: "Indian/South Asian content",   coverUrl: "", gifCount: 0 },
  { slug: "indian-babes",          name: "Indian Babes",       description: "Indian creators",              coverUrl: "", gifCount: 0 },
  { slug: "indian-couples",        name: "Indian Couples",     description: "Indian couple content",        coverUrl: "", gifCount: 0 },
  { slug: "indian-hotwife",        name: "Indian Hotwife",     description: "Indian hotwife",               coverUrl: "", gifCount: 0 },
  { slug: "indian-femdom",         name: "Indian Femdom",      description: "Indian femdom",                coverUrl: "", gifCount: 0 },
  { slug: "indian-sluts",          name: "Indian Sluts",       description: "Indian creators",              coverUrl: "", gifCount: 0 },
  { slug: "sweet-hijabis",         name: "Sweet Hijabis",      description: "Hijabi content",               coverUrl: "", gifCount: 0 },
  { slug: "brown-sluts",           name: "Brown Beauties",     description: "South Asian content",          coverUrl: "", gifCount: 0 },
  { slug: "kerala-babes",          name: "Kerala Babes",       description: "South Indian content",         coverUrl: "", gifCount: 0 },
  { slug: "hot-pakistani-freaks",  name: "Pakistani",          description: "Pakistani creators",           coverUrl: "", gifCount: 0 },
  { slug: "bangladeshi-milfs",     name: "Bangladeshi",        description: "Bangladeshi creators",         coverUrl: "", gifCount: 0 },
  { slug: "mature-indian",         name: "Mature Indian",      description: "Mature Indian content",        coverUrl: "", gifCount: 0 },
  { slug: "real-indian-goddesses", name: "Real Indian",        description: "Authentic Indian content",     coverUrl: "", gifCount: 0 },
  { slug: "indian-celebrity-nsfw", name: "Indian Celebrity",   description: "Indian celebrity content",     coverUrl: "", gifCount: 0 },
  { slug: "desi-cum",              name: "Desi Cum",           description: "Desi cum content",             coverUrl: "", gifCount: 0 },

  // ── Latina ──
  { slug: "latinas",               name: "Latinas",            description: "Latina creators",              coverUrl: "", gifCount: 0 },
  { slug: "latina-creampies",      name: "Latina Creampies",   description: "Latina creampie content",      coverUrl: "", gifCount: 0 },
  { slug: "latina-hotwife",        name: "Latina Hotwife",     description: "Latina hotwife",               coverUrl: "", gifCount: 0 },
  { slug: "latina-milfs",          name: "Latina MILFs",       description: "Latina MILF content",          coverUrl: "", gifCount: 0 },
  { slug: "submissive-latina",     name: "Submissive Latina",  description: "Latina submissive",            coverUrl: "", gifCount: 0 },
  { slug: "palg",                  name: "PALG",               description: "Phat ass Latina girls",        coverUrl: "", gifCount: 0 },
  { slug: "brazil-prime",          name: "Brazil",             description: "Brazilian content",            coverUrl: "", gifCount: 0 },
  { slug: "colombia",              name: "Colombian",          description: "Colombian creators",           coverUrl: "", gifCount: 0 },
  { slug: "mexican-girls",         name: "Mexican Girls",      description: "Mexican creators",             coverUrl: "", gifCount: 0 },

  // ── Top global niches ──
  { slug: "tik-tok",               name: "Tik Tok",            description: "Viral clips",                  coverUrl: "", gifCount: 0 },
  { slug: "amateur-girls",         name: "Amateur Girls",      description: "Real homemade",                coverUrl: "", gifCount: 0 },
  { slug: "twerk",                 name: "Twerk",              description: "Twerking clips",               coverUrl: "", gifCount: 0 },
  { slug: "big-ass",               name: "Big Ass",            description: "Curvy content",                coverUrl: "", gifCount: 0 },
  { slug: "blowjobs",              name: "Blowjobs",           description: "Oral content",                 coverUrl: "", gifCount: 0 },
  { slug: "creampies",             name: "Creampies",          description: "Creampie content",             coverUrl: "", gifCount: 0 },
  { slug: "big-tits",              name: "Big Tits",           description: "Busty content",                coverUrl: "", gifCount: 0 },
  { slug: "natural-big-tits",      name: "Natural Tits",       description: "Natural busty",                coverUrl: "", gifCount: 0 },
  { slug: "homemade",              name: "Homemade",           description: "Amateur homemade",             coverUrl: "", gifCount: 0 },
  { slug: "milf-riding",           name: "MILF Riding",        description: "MILF content",                 coverUrl: "", gifCount: 0 },
  { slug: "anal-sex",              name: "Anal Sex",           description: "Anal content",                 coverUrl: "", gifCount: 0 },
  { slug: "squirters",             name: "Squirters",          description: "Squirting clips",              coverUrl: "", gifCount: 0 },
  { slug: "fit-girls",             name: "Fit Girls",          description: "Athletic content",             coverUrl: "", gifCount: 0 },
  { slug: "ebony-girls",           name: "Ebony Girls",        description: "Ebony creators",               coverUrl: "", gifCount: 0 },
  { slug: "redheads",              name: "Redheads",           description: "Redhead creators",             coverUrl: "", gifCount: 0 },
  { slug: "goth-girls",            name: "Goth Girls",         description: "Goth aesthetic",               coverUrl: "", gifCount: 0 },
  { slug: "cosplay",               name: "Cosplay",            description: "Costume content",              coverUrl: "", gifCount: 0 },
  { slug: "bikini",                name: "Bikini",             description: "Beach content",                coverUrl: "", gifCount: 0 },
  { slug: "yoga",                  name: "Yoga",               description: "Yoga & poses",                 coverUrl: "", gifCount: 0 },
  { slug: "onlyfans-creators",     name: "OnlyFans",           description: "OnlyFans content",             coverUrl: "", gifCount: 0 },
  { slug: "pawg",                  name: "PAWG",               description: "Phat ass white girls",         coverUrl: "", gifCount: 0 },
  { slug: "bubble-butt",           name: "Bubble Butt",        description: "Round booty",                  coverUrl: "", gifCount: 0 },
  { slug: "couple",                name: "Real Couples",       description: "Couples content",              coverUrl: "", gifCount: 0 },
  { slug: "thick-thighs",          name: "Thick Thighs",       description: "Thick content",                coverUrl: "", gifCount: 0 },
];

// ─── Gender boosts ─────────────────────────────────────────────────────────
export const GENDER_BOOST: Record<string, string[]> = {
  male:   ["desi", "big-ass", "twerk"],
  female: ["desi", "yoga", "fit-girls"],
  all:    ["desi", "latinas"],
};

// ─── Emoji map ─────────────────────────────────────────────────────────────
export const NICHE_EMOJI: Record<string, string> = {
  "desi":                  "🇮🇳",
  "indian-babes":          "🇮🇳",
  "indian-couples":        "💑",
  "indian-hotwife":        "💍",
  "indian-femdom":         "👑",
  "indian-sluts":          "🔥",
  "sweet-hijabis":         "🧕",
  "brown-sluts":           "🌸",
  "kerala-babes":          "🌴",
  "hot-pakistani-freaks":  "🇵🇰",
  "bangladeshi-milfs":     "🇧🇩",
  "mature-indian":         "💎",
  "real-indian-goddesses": "✨",
  "indian-celebrity-nsfw": "⭐",
  "desi-cum":              "💦",
  "latinas":               "🌶️",
  "latina-creampies":      "💦",
  "latina-hotwife":        "💍",
  "latina-milfs":          "🔥",
  "submissive-latina":     "🎀",
  "palg":                  "🍑",
  "brazil-prime":          "🇧🇷",
  "colombia":              "🇨🇴",
  "mexican-girls":         "🇲🇽",
  "tik-tok":               "📱",
  "amateur-girls":         "📸",
  "twerk":                 "💃",
  "big-ass":               "🍑",
  "blowjobs":              "💋",
  "creampies":             "💦",
  "big-tits":              "🍒",
  "natural-big-tits":      "🌿",
  "homemade":              "🏠",
  "milf-riding":           "🏇",
  "anal-sex":              "🔞",
  "squirters":             "🌊",
  "fit-girls":             "💪",
  "ebony-girls":           "⭐",
  "redheads":              "🦊",
  "goth-girls":            "🖤",
  "cosplay":               "🎭",
  "bikini":                "👙",
  "yoga":                  "🧘",
  "onlyfans-creators":     "💅",
  "pawg":                  "🍑",
  "bubble-butt":           "🫧",
  "couple":                "👫",
  "thick-thighs":          "🦵",
};