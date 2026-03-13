import { NextRequest, NextResponse } from "next/server";
import { fetchCustomVideos, UserPreferences } from "@/lib/customFetch";

// CRITICAL: Tells Next.js to never cache this route, fixing the "same videos" bug.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const existingIdsRaw = searchParams.get("existingIds") || "";
    const existingIds = existingIdsRaw ? existingIdsRaw.split(",").filter(Boolean) : [];

    const nichesRaw = searchParams.get("niches") || "";
    const niches = nichesRaw ? nichesRaw.split(",").filter(Boolean) : ["dance"];
    
    const gender = (searchParams.get("gender") || "all") as UserPreferences["gender"];

    const prefs: UserPreferences = { niches, gender };
    const result = await fetchCustomVideos(prefs, page, existingIds);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Videos API error:", err);
    return NextResponse.json({ videos: [], token: "" }, { status: 500 });
  }
}