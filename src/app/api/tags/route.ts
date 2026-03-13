import { NextRequest, NextResponse } from "next/server";
import { fetchTrendingTags } from "@/lib/customFetch";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gender = searchParams.get("gender") || "all";
    
    const tags = await fetchTrendingTags(gender);
    return NextResponse.json({ tags });
  } catch (err) {
    console.error("Tags API error:", err);
    return NextResponse.json({ tags: [] }, { status: 500 });
  }
}