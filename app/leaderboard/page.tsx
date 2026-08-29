import { LeaderboardTable } from "../components/LeaderboardTable";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { formatPrice } from "../lib/pricing";
import { seededOwnerships } from "../lib/seed-data";
import { databaseBinding, getDatabaseOwners } from "../lib/live-db";

export default async function LeaderboardPage() {
  const liveOwners = await getDatabaseOwners(databaseBinding());
  const owners = liveOwners.length ? liveOwners : seededOwnerships;
  const totalBids = owners.reduce((sum, owner) => sum + owner.purchasePriceCents, 0);
  const topBid = owners.length ? Math.max(...owners.map((owner) => owner.purchasePriceCents)) : 0;
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
          <div><span>MINUTES OWNED</span><strong>{owners.length}</strong></div>
          <div><span>TOP BID</span><strong>{formatPrice(topBid)}</strong></div>
          <div><span>TOTAL BID VOLUME</span><strong>{formatPrice(totalBids)}</strong></div>
        </div>
      </section>
      <LeaderboardTable owners={owners} />
      <div className="leaderboard-note">All brands shown are demonstration data. Whoever bids the most owns the minute — until someone outbids them.</div>
      <SiteFooter />
    </main>
  );
}
