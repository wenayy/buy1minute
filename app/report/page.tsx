import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function ReportPage() {
  return (
    <main className="page-shell report-page"><SiteHeader /><section className="simple-form-page"><span className="eyebrow">SAFETY</span><h1>Report a listing.</h1><p>If a minute looks deceptive, harmful, or against the rules, tell us. Urgent safety reports are reviewed first.</p><form><label><span>MINUTE</span><input required pattern="[0-2][0-9]:[0-5][0-9]" placeholder="14:37" /></label><label><span>WHAT IS WRONG?</span><select required defaultValue=""><option value="" disabled>SELECT A REASON</option><option>Phishing or malware</option><option>Hate or harassment</option><option>Explicit content</option><option>Impersonation</option><option>Other policy violation</option></select></label><label><span>DETAILS</span><textarea required rows={6} maxLength={1000} /></label><label><span>YOUR EMAIL</span><input required type="email" /></label><button className="primary-button" type="submit">SEND REPORT →</button></form></section><SiteFooter /></main>
  );
}

