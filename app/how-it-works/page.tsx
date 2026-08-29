import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function HowItWorksPage() {
  return (
    <main className="page-shell how-page">
      <SiteHeader />
      <section className="page-intro compact-intro">
        <span className="eyebrow">THE WHOLE IDEA</span>
        <h1>One day.<br />1,440 owners.</h1>
        <p>A permanent piece of the internet that comes alive for exactly one minute, every single day.</p>
      </section>
      <section className="steps">
        <article><span>01 / 03</span><h2>Choose a minute</h2><p>Pick one of the 1,440 minutes in our shared UTC day. Choose a meaningful time or simply find an opening.</p></article>
        <article><span>02 / 03</span><h2>Make it yours</h2><p>Add your company, product, project, artwork, or profile. You control the message; we keep the format fast and safe.</p></article>
        <article><span>03 / 03</span><h2>Own the homepage</h2><p>Every day at your minute, Buy1Minute becomes yours for 60 seconds. Your permanent minute page never disappears.</p></article>
      </section>
      <section className="shared-clock-callout"><span>ONE SHARED CLOCK</span><strong>UTC</strong><p>Your local conversion is always shown, but ownership follows one global timeline. That is what makes each minute scarce.</p><Link className="primary-link" href="/explore">Find your minute →</Link></section>
      <SiteFooter />
    </main>
  );
}

