// src/app/api/vast/route.ts
import { NextResponse } from "next/server";

const ZONE_ID  = "5872218";
const VAST_URL = `https://s.magsrv.com/v1/vast.php?idzone=${ZONE_ID}`;
const MAX_REDIRECTS = 3;

async function fetchVast(url: string, depth = 0): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; VASTProxy/1.0)",
      Accept: "application/xml, text/xml, */*",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`VAST fetch ${res.status} from ${url}`);

  const xml = await res.text();

  if (process.env.NODE_ENV !== "production") {
    console.log(`[vast] depth=${depth} url=${url}`);
    console.log(`[vast] xml preview:`, xml.slice(0, 500));
  }

  // Follow Wrapper redirects — use [\s\S] instead of /s flag (ES2018)
  if (depth < MAX_REDIRECTS && xml.includes("VASTAdTagURI")) {
    const match =
      xml.match(/<VASTAdTagURI[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/VASTAdTagURI>/) ||
      xml.match(/<VASTAdTagURI[^>]*>([\s\S]*?)<\/VASTAdTagURI>/);

    if (match?.[1]) {
      const wrapperUrl = match[1].trim();
      console.log(`[vast] following wrapper to: ${wrapperUrl}`);
      try {
        return await fetchVast(wrapperUrl, depth + 1);
      } catch {
        return xml;
      }
    }
  }

  return xml;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const xml = await fetchVast(VAST_URL);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[vast proxy]", err?.message);
    const emptyVast = `<?xml version="1.0"?><VAST version="4.0"/>`;
    return new NextResponse(emptyVast, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }
}