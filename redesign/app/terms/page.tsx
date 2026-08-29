import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Terms & Moderation Guidelines",
  description: "Plain language rules and guidelines for Buy1Minute ownership.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#08080a]">
      <SiteHeader />

      <div className="flex-1 max-w-[800px] mx-auto w-full p-8 py-16">
        <span className="eyebrow text-[#ff4e24]">PLAIN LANGUAGE RULES</span>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mt-2">
          Keep Your Minute Worth Visiting.
        </h1>

        <div className="mt-8 space-y-6 text-sm text-white/70 leading-relaxed">
          <p>
            Buy1Minute is a shared canvas for the modern web. Every listing must respect visitors and maintain the safety and integrity of the platform.
          </p>

          <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Prohibited Content</h3>
            <ul className="list-disc pl-5 space-y-2 text-xs text-white/60">
              <li>Malware, phishing, deceptive scams, or credential harvesting links.</li>
              <li>Illegal material, explicit adult content, or unauthorized copyrighted media.</li>
              <li>Harassment, hate speech, or defamatory attacks against individuals or groups.</li>
              <li>Impersonation of brands, companies, or individuals without authorization.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Ownership Rights & Moderation</h3>
            <p className="text-xs text-white/60">
              Ownership grants the exclusive right to configure and display an active daily 60-second broadcast on the Buy1Minute homepage and a permanent minute archive page. It does not transfer ownership of physical time or guarantee specific visitor volumes.
            </p>
            <p className="text-xs text-white/60">
              If a listing violates these safety rules, our moderation team reserves the right to immediately pause or disable the listing.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Refunds & Outbidding</h3>
            <p className="text-xs text-white/60">
              When another user places a higher bid on an owned minute and completes payment, ownership transfers to the higher bidder. All transactions are processed securely via Dodo Payments.
            </p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
