// src/app/api/vast/route.ts
import { NextResponse } from "next/server";

const ZONE_ID = "5872218";

async function fetchVast(url: string, depth = 0): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; VASTProxy/1.0)",
      Accept: "application/xml, text/xml, */*",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`VAST ${res.status}`);
  const xml = await res.text();

  // Follow wrapper redirects ([\s\S] instead of /s flag for ES target compat)
  if (depth < 3 && xml.includes("VASTAdTagURI")) {
    const match =
      xml.match(/<VASTAdTagURI[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/VASTAdTagURI>/) ||
      xml.match(/<VASTAdTagURI[^>]*>([\s\S]*?)<\/VASTAdTagURI>/);
    if (match?.[1]) {
      try { return await fetchVast(match[1].trim(), depth + 1); } catch { return xml; }
    }
  }

  return xml;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Cache-buster ensures each impression is treated as unique by ExoClick
    const cb = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const url = `https://s.magsrv.com/v1/vast.php?idzone=${ZONE_ID}&cb=${cb}`;
    const xml = await fetchVast(url);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[vast]", err?.message);
    return new NextResponse(`<?xml version="1.0"?><VAST version="4.0"/>`, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }
}