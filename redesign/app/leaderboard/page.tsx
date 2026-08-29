import type { Metadata } from "next";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { formatPrice } from "../lib/pricing";
import { seededOwnerships } from "../lib/seed-data";

export const metadata: Metadata = {
  title: "All-Time Global Leaderboard",
  description: "Explore the highest valued minutes on the internet clock.",
};

const totalBids = seededOwnerships.reduce((sum, owner) => sum + owner.purchasePriceCents, 0);
const topBid = seededOwnerships.length
  ? Math.max(...seededOwnerships.map((owner) => owner.purchasePriceCents))
  : 0;

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#08080a]">
      <SiteHeader />

      <section className="leaderboard-hero">
        <span className="eyebrow text-[#ff4e24]">DISCOVERY · RANKED BY VALUE</span>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mt-2">
          The Hall of Minutes
        </h1>
        <p className="text-white/60 text-base max-w-xl mt-3">
          Whoever holds the winning bid owns the minute — until outbid. Discover top software, creators, and brands.
        </p>

        <div className="flex flex-wrap gap-8 mt-8 pb-6 border-b border-white/10">
          <div>
            <div className="font-mono text-2xl font-bold text-white">{seededOwnerships.length}</div>
            <div className="font-mono text-xs text-white/40">CLAIMED SLOTS</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-[#ff4e24]">{formatPrice(topBid)}</div>
            <div className="font-mono text-xs text-white/40">TOP SINGLE BID</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-emerald-400">{formatPrice(totalBids)}</div>
            <div className="font-mono text-xs text-white/40">TOTAL VOLUME</div>
          </div>
        </div>
      </section>

      <LeaderboardTable owners={seededOwnerships} />
      <SiteFooter />
    </main>
  );
}
