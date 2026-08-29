import Link from "next/link";
import { LogoMark } from "../components/LogoMark";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { displayHost } from "../lib/favicon";
import { formatPrice } from "../lib/pricing";
import { seededOwnerships } from "../lib/seed-data";
import { minuteIndexToSlug, minuteIndexToTime } from "../lib/time";

// Demo dashboard: some minutes are still winning, others have been outbid by a
// higher competing bid and need a raise to keep.
const myMinutes = seededOwnerships.slice(0, 5).map((owner, index) => {
  const outbid = index % 2 === 1;
  const yourBid = owner.purchasePriceCents;
  const topBid = outbid ? Math.round((yourBid * 1.35) / 100) * 100 : yourBid;
  return { owner, yourBid, topBid, status: outbid ? "outbid" : "winning" as "outbid" | "winning" };
});

const held = myMinutes.length;
const winning = myMinutes.filter((row) => row.status === "winning").length;
const outbidCount = myMinutes.filter((row) => row.status === "outbid").length;
const totalYourBids = myMinutes.reduce((sum, row) => sum + row.yourBid, 0);

export default function MyMinutesPage() {
  return (
    <main className="page-shell dashboard-page">
      <SiteHeader />
      <section className="dashboard-heading">
        <span className="eyebrow">YOUR BIDS · DEMO</span>
        <h1>My minutes</h1>
        <p>Track the minutes you hold, watch for outbids, and raise your bid to keep them.</p>
      </section>
      <div className="dashboard-summary">
        <div><span>MINUTES HELD</span><strong>{held}</strong></div>
        <div className="summary-good"><span>CURRENTLY WINNING</span><strong>{winning}</strong></div>
        <div className="summary-warn"><span>BEING OUTBID</span><strong>{outbidCount}</strong></div>
        <div><span>TOTAL BID</span><strong>{formatPrice(totalYourBids)}</strong></div>
      </div>
      <section className="bid-cards">
        {myMinutes.map((row) => {
          const slug = minuteIndexToSlug(row.owner.minuteIndex);
          const host = displayHost(row.owner.product.websiteUrl);
          return (
            <article key={row.owner.minuteIndex} className={`bid-card bid-card-${row.status}`} style={{ "--card-accent": row.owner.product.accentColor } as React.CSSProperties}>
              <div className="bid-card-time"><strong>{minuteIndexToTime(row.owner.minuteIndex)}</strong><span>UTC · daily</span></div>
              <div className="bid-card-brand">
                <LogoMark product={row.owner.product} small />
                <div><strong>{row.owner.product.name}</strong><small>{host}</small></div>
              </div>
              <div className="bid-card-figures">
                <div><span>YOUR BID</span><strong>{formatPrice(row.yourBid)}</strong></div>
                <div className={row.status === "outbid" ? "figure-lead" : ""}><span>TOP BID</span><strong>{formatPrice(row.topBid)}</strong></div>
              </div>
              <span className={`status-badge status-${row.status}`}>{row.status === "winning" ? "● WINNING" : "▲ OUTBID"}</span>
              <div className="bid-card-actions">
                {row.status === "outbid" ? (
                  <Link className="primary-button-sm" href={`/buy/${slug}?outbid=${row.topBid}`}>RAISE BID →</Link>
                ) : (
                  <Link className="ghost-button-sm" href={`/buy/${slug}?outbid=${row.yourBid}`}>RAISE BID</Link>
                )}
                <Link className="text-link" href={`/setup/${slug}`}>Edit listing</Link>
              </div>
            </article>
          );
        })}
      </section>
      <div className="dashboard-demo-note">This dashboard uses fictional data. Sign-in and live owner records activate when production identity and database bindings are connected.</div>
      <SiteFooter />
    </main>
  );
}
