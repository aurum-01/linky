// ─── src/components/OnboardingScreen.tsx ──────────────────────────────────

"use client";

import { useState } from "react";
import { NICHE_EMOJI } from "@/lib/redgifs/niches";
import type { RedgifsNiche, UserPreferences } from "@/lib/redgifs/types";

const GENDER_OPTIONS = [
  { key: "male",   emoji: "👨", label: "Male"     },
  { key: "female", emoji: "👩", label: "Female"   },
  { key: "all",    emoji: "🌈", label: "Everyone" },
] as const;

const MIN_NICHES = 3;

interface Props {
  niches: RedgifsNiche[];
  onComplete: (prefs: UserPreferences) => void;
}

export default function OnboardingScreen({ niches, onComplete }: Props) {
  const [step, setStep] = useState<"niches" | "gender">("niches");
  const [selected, setSelected] = useState<string[]>([]);
  const [gender, setGender] = useState<UserPreferences["gender"] | null>(null);

  const toggle = (slug: string) =>
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );

  const handleNichesContinue = () => {
    if (selected.length >= MIN_NICHES) setStep("gender");
  };

  const handleComplete = () => {
    if (!gender) return;
    const prefs: UserPreferences = { niches: selected, gender };
    localStorage.setItem("linky_prefs", JSON.stringify(prefs));
    onComplete(prefs);
  };

  // Auto-advance to gender step when 3+ niches chosen
  const canContinue = selected.length >= MIN_NICHES;

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center px-5 py-10 overflow-y-auto">

      {/* Logo */}
      <div className="text-center mb-8 mt-2">
        <h1 className="text-4xl font-bold text-white tracking-tight">linky</h1>
        <p className="text-white/30 text-sm mt-1">Your personalised feed</p>
      </div>

      {/* Step dots */}
      <div className="flex gap-2 mb-8">
        {["niches", "gender"].map((s) => (
          <div
            key={s}
            className={`h-[3px] rounded-full transition-all duration-300 ${step === s ? "w-10 bg-white" : "w-5 bg-white/20"}`}
          />
        ))}
      </div>

      {/* ── Step 1: Niche picker ── */}
      {step === "niches" && (
        <div className="w-full max-w-md animate-fadeIn">
          <div className="text-center mb-5">
            <h2 className="text-white text-xl font-semibold">What are you into?</h2>
            <p className="text-white/40 text-sm mt-0.5">
              Pick at least {MIN_NICHES} — your feed will match
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {niches.map((niche) => {
              const on = selected.includes(niche.slug);
              return (
                <button
                  key={niche.slug}
                  onClick={() => toggle(niche.slug)}
                  className={`
                    relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl border
                    text-center transition-all duration-150 cursor-pointer select-none
                    ${on
                      ? "bg-white text-black border-white scale-[0.96]"
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10 active:scale-95"}
                  `}
                >
                  {/* Cover image or emoji */}
                  {niche.coverUrl ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                      <img src={niche.coverUrl} alt={niche.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <span className="text-2xl leading-none">{NICHE_EMOJI[niche.slug] || "🎬"}</span>
                  )}
                  <span className={`text-[12px] font-semibold leading-tight ${on ? "text-black" : "text-white"}`}>
                    {niche.name}
                  </span>

                  {/* Checkmark */}
                  {on && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Counter + CTA */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/30 text-sm">
              {selected.length} selected
            </span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(selected.length, 8) }, (_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60" />
              ))}
              {Array.from({ length: Math.max(0, MIN_NICHES - selected.length) }, (_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/15" />
              ))}
            </div>
          </div>

          <button
            onClick={handleNichesContinue}
            disabled={!canContinue}
            className={`
              w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200
              ${canContinue
                ? "bg-white text-black hover:bg-white/90 active:scale-[0.98]"
                : "bg-white/8 text-white/25 cursor-not-allowed"}
            `}
          >
            {canContinue
              ? `Continue with ${selected.length} topics →`
              : `Choose ${MIN_NICHES - selected.length} more`}
          </button>
        </div>
      )}

      {/* ── Step 2: Gender picker ── */}
      {step === "gender" && (
        <div className="w-full max-w-md animate-fadeIn">
          <div className="text-center mb-8">
            <h2 className="text-white text-xl font-semibold">Who are you?</h2>
            <p className="text-white/40 text-sm mt-0.5">Personalises your recommendations</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {GENDER_OPTIONS.map((opt) => {
              const on = gender === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setGender(opt.key)}
                  className={`
                    flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-150 cursor-pointer
                    ${on ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/10 hover:bg-white/10"}
                  `}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="font-semibold text-lg">{opt.label}</span>
                  {on && (
                    <div className="ml-auto w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleComplete}
            disabled={!gender}
            className={`
              w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200
              ${gender
                ? "bg-white text-black hover:bg-white/90 active:scale-[0.98]"
                : "bg-white/8 text-white/25 cursor-not-allowed"}
            `}
          >
            Build my feed →
          </button>

          <button
            onClick={() => setStep("niches")}
            className="w-full mt-3 py-2 text-white/30 text-sm hover:text-white/60 transition-colors"
          >
            ← Back
          </button>
        </div>
      )}

    </div>
  );
}