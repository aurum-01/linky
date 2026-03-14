// ─── src/hooks/usePreferences.ts ──────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import type { UserPreferences } from "@/lib/redgifs/types";

const STORAGE_KEY = "linky_prefs";

function loadPrefs(): UserPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migrate old format: hashtags → niches
    const niches: string[] = parsed.niches ?? parsed.hashtags ?? [];
    const gender: UserPreferences["gender"] = parsed.gender ?? "all";
    if (!Array.isArray(niches) || niches.length === 0) return null;
    const migrated: UserPreferences = { niches, gender };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
    setReady(true);
  }, []);

  function savePrefs(p: UserPreferences) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setPrefs(p);
  }

  function clearPrefs() {
    localStorage.removeItem(STORAGE_KEY);
    setPrefs(null);
  }

  return { prefs, ready, savePrefs, clearPrefs };
}