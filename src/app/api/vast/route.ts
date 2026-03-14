// src/app/api/vast/route.ts
// Proxies the VAST XML from ExoClick to avoid CORS errors in the browser.
// Browser cannot directly fetch s.magsrv.com — this route does it server-side.

import { NextResponse } from "next/server";

const VAST_URL = `https://s.magsrv.com/v1/vast.php?idzone=5872218`;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(VAST_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VAST proxy)",
        Accept: "application/xml, text/xml, */*",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "VAST fetch failed" }, { status: 502 });
    }

    const xml = await res.text();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-store",
        // Allow browser to read this response
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[vast proxy]", err);
    return NextResponse.json({ error: "proxy error" }, { status: 500 });
  }
}