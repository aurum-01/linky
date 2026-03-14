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

// ─── Real slugs extracted from the RedGIFs niche list ─────────────────────
// Only niches that are mainstream and work with guest tokens.
// Sorted by approximate popularity.
export const FALLBACK_NICHES: RedgifsNiche[] = [
  { slug: "tik-tok",            name: "Tik Tok",            description: "Viral clips",             coverUrl: "", gifCount: 0 },
  { slug: "big-tits",           name: "Big Tits",           description: "Busty content",           coverUrl: "", gifCount: 0 },
  { slug: "amateur-girls",      name: "Amateur Girls",      description: "Real homemade content",   coverUrl: "", gifCount: 0 },
  { slug: "twerk",              name: "Twerk",              description: "Twerking clips",          coverUrl: "", gifCount: 0 },
  { slug: "blowjobs",           name: "Blowjobs",           description: "Oral content",            coverUrl: "", gifCount: 0 },
  { slug: "big-ass",            name: "Big Asses",          description: "Curvy content",           coverUrl: "", gifCount: 0 },
  { slug: "creampies",          name: "Creampies",          description: "Creampie clips",          coverUrl: "", gifCount: 0 },
  { slug: "latinas",            name: "Latinas",            description: "Latina creators",         coverUrl: "", gifCount: 0 },
  { slug: "lesbian-strapon",    name: "Lesbian Strap On",   description: "Strap on content",        coverUrl: "", gifCount: 0 },
  { slug: "milf-riding",        name: "MILF Riding",        description: "MILF content",            coverUrl: "", gifCount: 0 },
  { slug: "anal-sex",           name: "Anal Sex",           description: "Anal content",            coverUrl: "", gifCount: 0 },
  { slug: "cosplay",            name: "Cosplay",            description: "Costume & character",     coverUrl: "", gifCount: 0 },
  { slug: "yoga",               name: "Yoga",               description: "Yoga & poses",            coverUrl: "", gifCount: 0 },
  { slug: "bikini",             name: "Bikini",             description: "Beach content",           coverUrl: "", gifCount: 0 },
  { slug: "dance",              name: "Dance",              description: "Dance clips",             coverUrl: "", gifCount: 0 },
  { slug: "fit-girls",          name: "Fit Girls",          description: "Athletic content",        coverUrl: "", gifCount: 0 },
  { slug: "squirters",          name: "Squirters",          description: "Squirting clips",         coverUrl: "", gifCount: 0 },
  { slug: "petite-asians",      name: "Petite Asians",      description: "Petite Asian content",   coverUrl: "", gifCount: 0 },
  { slug: "korean-hotties",     name: "Korean Hotties",     description: "Korean creators",         coverUrl: "", gifCount: 0 },
  { slug: "jav",                name: "JAV",                description: "Japanese adult video",   coverUrl: "", gifCount: 0 },
  { slug: "ebony-girls",        name: "Ebony Girls",        description: "Ebony creators",          coverUrl: "", gifCount: 0 },
  { slug: "natural-big-tits",   name: "Natural Big Tits",   description: "Natural busty content",  coverUrl: "", gifCount: 0 },
  { slug: "redheads",           name: "Redheads",           description: "Redhead creators",        coverUrl: "", gifCount: 0 },
  { slug: "goth-girls",         name: "Goth Girls",         description: "Goth aesthetic",          coverUrl: "", gifCount: 0 },
  { slug: "gym-girls",          name: "Gym Girls",          description: "Fitness & gym",           coverUrl: "", gifCount: 0 },
  { slug: "homemade",           name: "Homemade",           description: "Amateur homemade",        coverUrl: "", gifCount: 0 },
  { slug: "outdoor-sex",        name: "Outdoor Sex",        description: "Public & outdoor",        coverUrl: "", gifCount: 0 },
  { slug: "pawg",               name: "PAWG",               description: "Phat ass white girls",   coverUrl: "", gifCount: 0 },
  { slug: "college-sluts",      name: "College Sluts",      description: "College content",         coverUrl: "", gifCount: 0 },
  { slug: "tattoed-pornstars",  name: "Tattooed Girls",     description: "Inked creators",          coverUrl: "", gifCount: 0 },
  { slug: "milfs-in-lingerie",  name: "MILFs in Lingerie",  description: "Lingerie content",        coverUrl: "", gifCount: 0 },
  { slug: "doggystyle",         name: "Doggy Style",        description: "Doggystyle clips",        coverUrl: "", gifCount: 0 },
  { slug: "riding-dick",        name: "Riding Dick",        description: "Cowgirl riding",          coverUrl: "", gifCount: 0 },
  { slug: "pussy-eating",       name: "Pussy Eating",       description: "Oral content",            coverUrl: "", gifCount: 0 },
  { slug: "compilation",        name: "Compilations",       description: "Best of compilations",   coverUrl: "", gifCount: 0 },
  { slug: "bubble-butt",        name: "Bubble Butt",        description: "Round booty content",    coverUrl: "", gifCount: 0 },
  { slug: "feet",               name: "Feet",               description: "Foot fetish content",    coverUrl: "", gifCount: 0 },
  { slug: "braless",            name: "Braless",            description: "Braless girls",           coverUrl: "", gifCount: 0 },
  { slug: "striptease",         name: "Striptease",         description: "Strip & tease",           coverUrl: "", gifCount: 0 },
  { slug: "onlyfans-creators",  name: "OnlyFans Creators",  description: "OnlyFans content",        coverUrl: "", gifCount: 0 },
  { slug: "girls-in-yoga-pants", name: "Yoga Pants",        description: "Yoga pants content",     coverUrl: "", gifCount: 0 },
  { slug: "pawg-panty",         name: "PAWG Panty",         description: "Panty & booty",           coverUrl: "", gifCount: 0 },
  { slug: "ebony-milfs",        name: "Ebony MILFs",        description: "Mature ebony content",   coverUrl: "", gifCount: 0 },
  { slug: "asian-sex",          name: "Asian Sex",          description: "Asian creators",          coverUrl: "", gifCount: 0 },
  { slug: "couple",             name: "Real Couples",       description: "Couples content",         coverUrl: "", gifCount: 0 },
  { slug: "thick-thighs",       name: "Thick Thighs",       description: "Thick content",           coverUrl: "", gifCount: 0 },
  { slug: "massage-porn",       name: "Massage Porn",       description: "Massage content",         coverUrl: "", gifCount: 0 },
  { slug: "girlfriends",        name: "Girlfriends",        description: "GF experience",           coverUrl: "", gifCount: 0 },
  { slug: "beautiful-porn",     name: "Beautiful Porn",     description: "High quality content",   coverUrl: "", gifCount: 0 },
  { slug: "boudoir",            name: "Boudoir",            description: "Boudoir photography",    coverUrl: "", gifCount: 0 },
];

// Gender boost map — safe slugs only
export const GENDER_BOOST: Record<string, string[]> = {
  male:   ["twerk", "big-ass", "tik-tok"],
  female: ["dance", "yoga", "fitness-girls"],
  all:    [],
};

// Emoji map keyed on slug
export const NICHE_EMOJI: Record<string, string> = {
  "tik-tok":             "📱",
  "big-tits":            "🍒",
  "amateur-girls":       "📸",
  "twerk":               "💃",
  "blowjobs":            "💋",
  "big-ass":             "🍑",
  "big-asses":           "🍑",
  "creampies":           "💦",
  "latinas":             "🌶️",
  "lesbian-strapon":     "🔗",
  "milf-riding":         "🏇",
  "anal-sex":            "🔞",
  "cosplay":             "🎭",
  "yoga":                "🧘",
  "bikini":              "👙",
  "dance":               "🕺",
  "fit-girls":           "💪",
  "squirters":           "🌊",
  "petite-asians":       "🌸",
  "korean-hotties":      "🇰🇷",
  "jav":                 "🎌",
  "ebony-girls":         "⭐",
  "natural-big-tits":    "🌿",
  "redheads":            "🦊",
  "goth-girls":          "🖤",
  "gym-girls":           "🏋️",
  "homemade":            "🏠",
  "outdoor-sex":         "🌳",
  "pawg":                "🍑",
  "college-sluts":       "🎓",
  "milfs-in-lingerie":   "👗",
  "doggystyle":          "🔄",
  "riding-dick":         "🤸",
  "pussy-eating":        "👅",
  "compilation":         "📽️",
  "bubble-butt":         "🫧",
  "feet":                "🦶",
  "braless":             "✨",
  "striptease":          "💃",
  "onlyfans-creators":   "💅",
  "girls-in-yoga-pants": "🩱",
  "pawg-panty":          "🩲",
  "ebony-milfs":         "👑",
  "asian-sex":           "🌸",
  "couple":              "👫",
  "thick-thighs":        "🦵",
  "massage-porn":        "💆",
  "girlfriends":         "💕",
  "beautiful-porn":      "🌟",
  "boudoir":             "📷",
  "tattoed-pornstars":   "🎨",
};