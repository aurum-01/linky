// ─── src/app/api/videos/route.ts ──────────────────────────────────────────
// Place at: src/app/api/videos/route.ts

import { NextRequest, NextResponse } from "next/server";
import { assembleFeed } from "@/lib/redgifs/feed";
import type { UserPreferences } from "@/lib/redgifs/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const existingIds = (searchParams.get("existingIds") || "")
      .split(",")
      .filter(Boolean);

    const niches = (searchParams.get("niches") || "")
      .split(",")
      .filter(Boolean);

    if (niches.length === 0) {
      return NextResponse.json({ videos: [], token: "", hasMore: false }, { status: 400 });
    }

    const gender = (searchParams.get("gender") || "all") as UserPreferences["gender"];
    const prefs: UserPreferences = { niches, gender };

    const result = await assembleFeed(prefs, page, existingIds);

    return NextResponse.json(result, {
      headers: {
        // No CDN caching for personalised feeds
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[api/videos] error:", err);
    return NextResponse.json({ videos: [], token: "", hasMore: false }, { status: 500 });
  }
}