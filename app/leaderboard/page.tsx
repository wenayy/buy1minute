import { LeaderboardTable } from "../components/LeaderboardTable";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { formatPrice } from "../lib/pricing";
import { seededOwnerships } from "../lib/seed-data";

const totalBids = seededOwnerships.reduce((sum, owner) => sum + owner.purchasePriceCents, 0);
const topBid = Math.max(...seededOwnerships.map((owner) => owner.purchasePriceCents));
// Full set is large now; show the top ranks and keep the totals honest.
const topOwners = [...seededOwnerships].sort((a, b) => b.purchasePriceCents - a.purchasePriceCents).slice(0, 60);

export default function LeaderboardPage() {
  return (
    <main className="page-shell leaderboard-page">
      <SiteHeader />
      <section className="leaderboard-hero">
        <div>
          <span className="eyebrow">DISCOVERY · RANKED BY WINNING BID</span>
          <h1>The highest bidders own it.</h1>
          <p>Whoever bids the most owns the minute — until someone outbids them.</p>
        </div>
        <div className="leaderboard-hero-stats">
          <div><span>MINUTES OWNED</span><strong>{seededOwnerships.length}</strong></div>
          <div><span>TOP BID</span><strong>{formatPrice(topBid)}</strong></div>
          <div><span>TOTAL BID VOLUME</span><strong>{formatPrice(totalBids)}</strong></div>
        </div>
      </section>
      <LeaderboardTable owners={topOwners} />
      <div className="leaderboard-note">All brands shown are demonstration data. Whoever bids the most owns the minute — until someone outbids them.</div>
      <SiteFooter />
    </main>
  );
}
