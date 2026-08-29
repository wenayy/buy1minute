import type { Metadata } from "next";
import { ExploreGrid } from "../components/ExploreGrid";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { seededOwnerships } from "../lib/seed-data";

export const metadata: Metadata = {
  title: "Explore the 1,440-Minute Solar Matrix",
  description: "Browse every minute of the global UTC day. Find open slots and outbid reigning brands.",
};

export default function ExplorePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#08080a]">
      <SiteHeader />

      <section className="px-8 pt-16 pb-8 max-w-[1440px] mx-auto w-full">
        <span className="eyebrow text-[#ff4e24]">THE SOLAR MATRIX · UTC</span>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mt-2">
          1,440 Chances to Own the Internet.
        </h1>
        <p className="text-white/60 text-base max-w-2xl mt-3">
          Every minute in a 24-hour day is scarce and unique. Own one permanently to unlock a daily 60-second broadcast to all visitors.
        </p>

        <div className="flex gap-8 mt-8 pb-6 border-b border-white/10">
          <div>
            <div className="font-mono text-2xl font-bold text-white">{seededOwnerships.length}</div>
            <div className="font-mono text-xs text-white/40">OWNED</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-emerald-400">
              {1_440 - seededOwnerships.length}
            </div>
            <div className="font-mono text-xs text-white/40">AVAILABLE</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-[#ff4e24]">60s</div>
            <div className="font-mono text-xs text-white/40">DAILY AIRTIME</div>
          </div>
        </div>
      </section>

      <ExploreGrid />
      <SiteFooter />
    </main>
  );
}
