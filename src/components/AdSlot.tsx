// ─── src/components/AdSlot.tsx ─────────────────────────────────────────────
//
// Renders an ad slot in the feed.
// Currently shows a "Sponsored" placeholder.
// To integrate a real ad network: replace the inner div with your ad unit.

"use client";

export default function AdSlot({ index }: { index: number }) {
  return (
    <div className="relative w-full h-full bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">

      {/* Placeholder ad creative */}
      <div className="w-[85%] max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
          <span className="text-white text-2xl">✦</span>
        </div>
        <div className="space-y-1">
          <p className="text-white font-semibold text-lg">Your Ad Here</p>
          <p className="text-white/40 text-sm leading-relaxed">
            Reach millions of engaged viewers.<br />Advertise with linky.
          </p>
        </div>
        <button className="bg-white text-black text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-white/90 transition active:scale-95">
          Learn More
        </button>
      </div>

      {/* Sponsored label */}
      <div className="absolute top-4 left-4 z-20">
        <span className="text-white/40 text-[11px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          Sponsored
        </span>
      </div>

      {/* Slot number for debugging — remove in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-4 right-4 text-white/20 text-[10px]">
          ad slot #{index}
        </div>
      )}
    </div>
  );
}