// ─── src/components/AppShell.tsx ──────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import OnboardingScreen from "./OnboardingScreen";
import FeedClient from "./FeedClient";
import type { StreamVideo, UserPreferences, RedgifsNiche } from "@/lib/redgifs/types";

type Phase = "boot" | "onboarding" | "loading" | "feed" | "empty";

export default function AppShell() {
  const { prefs, ready, savePrefs, clearPrefs } = usePreferences();

  const [phase, setPhase]   = useState<Phase>("boot");
  const [niches, setNiches] = useState<RedgifsNiche[]>([]);
  const [videos, setVideos] = useState<StreamVideo[]>([]);
  const [token, setToken]   = useState("");

  // Fetch niche list for onboarding (non-blocking)
  useEffect(() => {
    fetch("/api/niches")
      .then((r) => r.json())
      .then((d) => { if (d.niches?.length) setNiches(d.niches); })
      .catch(() => {}); // OnboardingScreen has built-in fallback niches
  }, []);

  // Once preferences are loaded from localStorage, kick off feed load or onboarding
  useEffect(() => {
    if (!ready) return;
    if (prefs) {
      loadFeed(prefs);
    } else {
      setPhase("onboarding");
    }
  }, [ready, prefs?.niches.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadFeed(p: UserPreferences) {
    setPhase("loading");
    try {
      const params = new URLSearchParams({
        page: "1",
        existingIds: "",
        niches: p.niches.join(","),
        gender: p.gender,
      });
      const res = await fetch(`/api/videos?${params}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (!data.videos?.length) { setPhase("empty"); return; }
      setVideos(data.videos);
      setToken(data.token || "");
      setPhase("feed");
    } catch (err) {
      console.error("[AppShell] loadFeed error:", err);
      clearPrefs();
      setPhase("onboarding");
    }
  }

  function handleOnboardingComplete(p: UserPreferences) {
    savePrefs(p);
    loadFeed(p);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === "boot" || phase === "loading") {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/15 border-t-white rounded-full animate-spin" />
          {phase === "loading" && (
            <p className="text-white/30 text-[11px] uppercase tracking-widest font-light animate-pulse">
              Building your feed
            </p>
          )}
        </div>
      </div>
    );
  }

  if (phase === "onboarding") {
    return <OnboardingScreen niches={niches} onComplete={handleOnboardingComplete} />;
  }

  if (phase === "empty") {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <p className="text-white/50 text-sm">No videos found for your niches.</p>
          <button
            onClick={() => { clearPrefs(); setPhase("onboarding"); }}
            className="text-sm text-white bg-white/10 hover:bg-white/20 border border-white/15 px-5 py-2.5 rounded-full transition"
          >
            Choose different niches
          </button>
        </div>
      </div>
    );
  }

  if (!prefs) return null; // guard — should never reach here

  return (
    <FeedClient
      initialVideos={videos}
      initialToken={token}
      prefs={prefs}
    />
  );
}