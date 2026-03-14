// src/lib/redgifs/client.ts

import { getToken, invalidateToken, buildAuthHeaders } from "./auth";
import type { RateLimitState } from "./types";

const BASE = "https://api.redgifs.com";
const TIMEOUT_MS = 10_000;
const RATE_SAFETY_THRESHOLD = 5;

let _rateLimit: RateLimitState = { remaining: 100, resetAt: 0 };

export function getRateLimitState(): RateLimitState {
  return { ..._rateLimit };
}

function parseRateLimitHeaders(headers: Headers): void {
  const remaining = headers.get("X-Ratelimit-Remaining");
  const reset = headers.get("X-Ratelimit-Reset");
  if (remaining !== null) _rateLimit.remaining = parseInt(remaining, 10);
  if (reset !== null) _rateLimit.resetAt = parseInt(reset, 10) * 1_000;
}

async function waitForRateLimitIfNeeded(): Promise<void> {
  if (_rateLimit.remaining < RATE_SAFETY_THRESHOLD && _rateLimit.resetAt > Date.now()) {
    const wait = _rateLimit.resetAt - Date.now() + Math.random() * 2_000;
    console.warn(`[redgifs] Rate limit low (${_rateLimit.remaining} remaining), waiting ${Math.round(wait)}ms`);
    await new Promise((r) => setTimeout(r, wait));
  }
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow", // follow 301 redirects automatically
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet(path: string): Promise<any> {
  await waitForRateLimitIfNeeded();

  let token = await getToken();
  let res = await fetchWithTimeout(`${BASE}${path}`, {
    headers: buildAuthHeaders(token),
    cache: "no-store",
  });

  parseRateLimitHeaders(res.headers);

  // Token expired — refresh once and retry
  if (res.status === 401) {
    invalidateToken();
    token = await getToken();
    res = await fetchWithTimeout(`${BASE}${path}`, {
      headers: buildAuthHeaders(token),
      cache: "no-store",
    });
    parseRateLimitHeaders(res.headers);
  }

  // Rate limited — back off and retry once
  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    const wait = retryAfter
      ? parseInt(retryAfter, 10) * 1_000
      : (_rateLimit.resetAt - Date.now()) + Math.random() * 3_000;
    await new Promise((r) => setTimeout(r, Math.max(wait, 2_000)));
    res = await fetchWithTimeout(`${BASE}${path}`, {
      headers: buildAuthHeaders(token),
      cache: "no-store",
    });
    parseRateLimitHeaders(res.headers);
  }

  if (!res.ok) {
    throw new Error(`RedGIFs API ${res.status} on ${path}`);
  }

  return res.json();
}

export async function apiGetSafe(path: string): Promise<any | null> {
  try {
    return await apiGet(path);
  } catch (err: any) {
    const msg: string = err?.message ?? "";
    // Silently skip expected errors — 404 gone, 410 deleted, 403 access denied
    if (msg.includes("404") || msg.includes("410") || msg.includes("403") || msg.includes("301")) {
      return null;
    }
    console.warn(`[redgifs] apiGetSafe failed for ${path}:`, msg);
    return null;
  }
}