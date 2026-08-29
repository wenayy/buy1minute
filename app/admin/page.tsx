import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { seededOwnerships } from "../lib/seed-data";
import { minuteIndexToTime } from "../lib/time";

export default function AdminPage() {
  return (
    <main className="page-shell admin-page"><SiteHeader /><section className="dashboard-heading"><span className="eyebrow">PROTECTED OPERATIONS · DEMO</span><h1>Admin</h1><p>Moderation, purchases, and pricing control.</p></section><div className="dashboard-summary"><div><span>ACTIVE OWNERS</span><strong>{seededOwnerships.length}</strong></div><div><span>OPEN REPORTS</span><strong>0</strong></div><div><span>RESERVATIONS</span><strong>0</strong></div><div><span>24H EVENTS</span><strong>12,419</strong></div></div><section className="admin-table"><header><span>MINUTE / OWNER</span><span>STATUS</span><span>PRICE</span><span>ACTION</span></header>{seededOwnerships.slice(0, 7).map((owner) => <div key={owner.minuteIndex}><span><strong>{minuteIndexToTime(owner.minuteIndex)}</strong> {owner.product.name}</span><span className="status-active">ACTIVE</span><span>${(owner.purchasePriceCents / 100).toFixed(0)}</span><button type="button">REVIEW</button></div>)}</section><div className="dashboard-demo-note">Production access must be enforced server-side with an admin allowlist before this route is public.</div><SiteFooter /></main>
  );
}

