// src/hooks/useClientToken.ts
//
// Fetches a RedGIFs auth token DIRECTLY from the browser.
// This is critical — the JWT contains a `valid_addr` claim that
// binds it to the IP that requested it. If the server fetches
// the token, `valid_addr` = server IP, and the iframe (running
// in the browser at a different IP) gets rejected with 401/403.
//
// By fetching here in the browser, the token is bound to the
// user's actual IP, matching what the iframe CDN validates.

"use client";

import { useState, useEffect, useRef } from "react";

const AUTH_URL = "https://api.redgifs.com/v2/auth/temporary";
const STORAGE_KEY = "linky_client_token";
const STORAGE_EXPIRY_KEY = "linky_client_token_expiry";
// Refresh 5 minutes before expiry
const BUFFER_MS = 5 * 60 * 1000;

async function fetchBrowserToken(): Promise<{ token: string; expiresAt: number }> {
  const res = await fetch(AUTH_URL, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      // Use the real browser UA — must match what the browser sends naturally
      // RedGIFs validates UA consistency between token request and usage
    },
  });

  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);

  const json = await res.json();
  const token: string = json.token || json.access_token || json.bearer;
  if (!token) throw new Error("No token in response");

  const expiresIn: number = json.expires_in || json.expires || 86_400;
  const expiresAt = Date.now() + expiresIn * 1_000;

  // Persist so we don't re-fetch on every component mount
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
    sessionStorage.setItem(STORAGE_EXPIRY_KEY, String(expiresAt));
  } catch {
    // ignore storage errors (private browsing, etc.)
  }

  return { token, expiresAt };
}

function loadCachedToken(): { token: string; expiresAt: number } | null {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY);
    const expiry = sessionStorage.getItem(STORAGE_EXPIRY_KEY);
    if (!token || !expiry) return null;
    const expiresAt = parseInt(expiry, 10);
    if (Date.now() >= expiresAt - BUFFER_MS) return null; // expired
    return { token, expiresAt };
  } catch {
    return null;
  }
}

interface UseClientTokenResult {
  token: string;
  ready: boolean;
  error: string | null;
}

export function useClientToken(): UseClientTokenResult {
  const [token, setToken] = useState<string>("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function refresh() {
    try {
      // Try cache first
      const cached = loadCachedToken();
      if (cached) {
        setToken(cached.token);
        setReady(true);
        // Schedule next refresh
        const ttl = cached.expiresAt - Date.now() - BUFFER_MS;
        if (ttl > 0) {
          timerRef.current = setTimeout(refresh, ttl);
        }
        return;
      }

      const { token: newToken, expiresAt } = await fetchBrowserToken();
      setToken(newToken);
      setReady(true);
      setError(null);

      // Schedule auto-refresh before expiry
      const ttl = expiresAt - Date.now() - BUFFER_MS;
      if (ttl > 0) {
        timerRef.current = setTimeout(refresh, ttl);
      }
    } catch (err: any) {
      console.error("[useClientToken] Failed to fetch browser token:", err);
      setError(err.message);
      setReady(true); // still mark ready so the UI doesn't hang
    }
  }

  useEffect(() => {
    refresh();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { token, ready, error };
}