"use client";

import { useState, useEffect } from "react";
import { UserPreferences, RedgifsNiche } from "@/lib/customFetch";

const GENDER_OPTIONS = [
  { key: "male", label: "Male", emoji: "👨" },
  { key: "female", label: "Female", emoji: "👩" },
  { key: "all", label: "Everyone", emoji: "🌈" },
];

interface Props {
  onComplete: (prefs: UserPreferences) => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState<"gender" | "loading" | "tags">("gender");
  const [selectedGender, setSelectedGender] = useState<"male" | "female" | "all" | null>(null);
  
  const [dynamicTags, setDynamicTags] = useState<RedgifsNiche[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("linky_prefs");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.gender) setSelectedGender(parsed.gender);
        if (parsed.niches && parsed.niches.length > 0) {
          setSelectedNiche(parsed.niches[0]);
        }
      }
    } catch (e) {
      console.error("Failed to parse prefs", e);
    }
  }, []);

  const handleGenderSelect = async (gender: "male" | "female" | "all") => {
    setSelectedGender(gender);
    setStep("loading");

    try {
      const res = await fetch(`/api/tags?gender=${gender}`);
      const data = await res.json();
      setDynamicTags(data.tags || []);
    } catch (err) {
      console.error("Failed to fetch tags", err);
    }

    setStep("tags");
  };

  const complete = () => {
    if (!selectedGender || !selectedNiche) return;
    const prefs: UserPreferences = {
      gender: selectedGender,
      niches: [selectedNiche], // Strict 1 tag
    };
    localStorage.setItem("linky_prefs", JSON.stringify(prefs));
    onComplete(prefs);
  };

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-black flex flex-col items-center px-5 py-10">
      <div className="text-center mb-10 shrink-0">
        <h1 className="text-4xl font-bold text-white tracking-tight">linky</h1>
        <p className="text-white/40 text-sm">Your personalised feed</p>
      </div>

      <div className="flex gap-2 mb-8 shrink-0">
        <div className={`h-1 w-16 rounded ${step === "gender" ? "bg-white" : "bg-white/20"}`} />
        <div className={`h-1 w-16 rounded ${step === "tags" ? "bg-white" : "bg-white/20"}`} />
      </div>

      {step === "gender" && (
        <div className="w-full max-w-md pb-10">
          <div className="text-center mb-8">
            <h2 className="text-white text-xl font-semibold">Who are you?</h2>
            <p className="text-white/40 text-sm">Helps us find the best content</p>
          </div>

          <div className="flex flex-col gap-3">
            {GENDER_OPTIONS.map((opt) => {
              const selected = selectedGender === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleGenderSelect(opt.key as any)}
                  className={`
                    flex items-center gap-4 p-5 rounded-2xl border transition-all
                    ${selected ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/10 hover:bg-white/10"}
                  `}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="font-semibold text-lg">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Finding top tags...</p>
        </div>
      )}

      {step === "tags" && (
        <div className="w-full max-w-md pb-10 flex flex-col items-center">
          <div className="text-center mb-6">
            <h2 className="text-white text-xl font-semibold">Pick one vibe</h2>
            <p className="text-white/40 text-sm">Extracted from top trending</p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            {dynamicTags.map((niche) => {
              const selected = selectedNiche === niche.slug;
              return (
                <button
                  key={niche.slug}
                  onClick={() => setSelectedNiche(niche.slug)}
                  className={`
                    flex items-center justify-center p-4 rounded-2xl border transition-all h-24
                    ${selected ? "bg-white text-black border-white scale-95 shadow-lg shadow-white/20" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}
                  `}
                >
                  <span className="text-sm font-bold text-center capitalize">{niche.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col w-full gap-3 sticky bottom-4">
            <button
              onClick={() => setStep("gender")}
              className="w-full py-3 text-white/40 text-sm underline"
            >
              ← Change Gender
            </button>
            <button
              onClick={complete}
              disabled={!selectedNiche}
              className={`
                w-full py-4 rounded-2xl font-semibold transition-all shadow-xl backdrop-blur-md
                ${selectedNiche ? "bg-white text-black" : "bg-white/10 text-white/30"}
              `}
            >
              Build my feed →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}