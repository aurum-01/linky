"use client";

import { useState, useEffect } from "react";
import OnboardingScreen from "./OnboardingScreen";
import FeedClient from "./FeedClient";
import { StreamVideo, UserPreferences } from "@/lib/customFetch";

type Phase = "checking" | "onboarding" | "loading" | "feed";

function loadStoredPrefs(): UserPreferences | null {
  try {
    const raw = localStorage.getItem("linky_prefs");
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    const niches: string[] = parsed.niches ?? parsed.hashtags ?? [];
    const gender: UserPreferences["gender"] = parsed.gender ?? "all";

    if (!Array.isArray(niches) || niches.length === 0) return null;

    const migrated: UserPreferences = { niches, gender };
    localStorage.setItem("linky_prefs", JSON.stringify(migrated));
    return migrated;
  } catch {
    localStorage.removeItem("linky_prefs");
    return null;
  }
}

export default function AppShell() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [videos, setVideos] = useState<StreamVideo[]>([]);

  useEffect(() => {
    async function init() {
      const stored = loadStoredPrefs();
      if (stored) {
        setPrefs(stored);
        await loadFeed(stored);
      } else {
        setPhase("onboarding");
      }
    }
    init();
  }, []);

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
      if (!data.videos?.length) throw new Error("No videos returned");
      setVideos(data.videos);
      setPhase("feed");
    } catch (err) {
      console.error("Failed to load feed:", err);
      localStorage.removeItem("linky_prefs");
      setPhase("onboarding");
    }
  }

  function handleOnboardingComplete(p: UserPreferences) {
    setPrefs(p);
    loadFeed(p);
  }

  function handleEditPrefs() {
    setPhase("onboarding");
  }

  if (phase === "checking") {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-black">
        <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "onboarding") {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/40 text-sm tracking-widest uppercase font-light">Building your feed</p>
        </div>
      </div>
    );
  }

  if (!prefs || videos.length === 0) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <p className="text-white/50 text-sm">Nothing to show yet.</p>
          <button onClick={handleEditPrefs} className="text-white/40 text-xs underline">
            Change preferences
          </button>
        </div>
      </div>
    );
  }

  return <FeedClient videos={videos} prefs={prefs} onEditPrefs={handleEditPrefs} />;
}