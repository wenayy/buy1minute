import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function TermsPage() {
  return (
    <main className="page-shell legal-page"><SiteHeader /><article><span className="eyebrow">PLAIN-LANGUAGE RULES</span><h1>Keep your minute worth visiting.</h1><p>Buy1Minute listings may not contain or link to illegal, deceptive, explicit, malicious, phishing, hateful, or rights-infringing content. We may immediately pause a takeover that risks visitors or the platform.</p><p>Ownership means the right to an active listing under these rules; it does not transfer ownership of time itself or guarantee traffic. Payments, moderation, refunds, and deactivation are handled under the complete production terms presented at checkout.</p><p>Uploads are limited to supported image formats. Executable content, arbitrary HTML, scripts, trackers, and custom CSS are not accepted.</p></article><SiteFooter /></main>
  );
}

