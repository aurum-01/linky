// ─── src/app/api/niches/route.ts ──────────────────────────────────────────
// Place at: src/app/api/niches/route.ts

import { NextResponse } from "next/server";
import { fetchNiches } from "@/lib/redgifs/niches";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const niches = await fetchNiches();
    return NextResponse.json({ niches }, {
      headers: {
        // Cache niche list for 10 minutes on CDN — it rarely changes
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[api/niches] error:", err);
    return NextResponse.json({ niches: [] }, { status: 500 });
  }
}