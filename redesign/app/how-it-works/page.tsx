import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "How Buy1Minute Works",
  description: "Learn how scarce minute ownership, daily broadcasts, and outbidding work.",
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#08080a]">
      <SiteHeader />

      <section className="px-8 pt-16 pb-12 max-w-[1000px] mx-auto w-full">
        <span className="eyebrow text-[#ff4e24]">THE ARCHITECTURE</span>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mt-2">
          One Day. 1,440 Owners.
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mt-4 leading-relaxed">
          The internet is infinite, but time is scarce. Buy1Minute divides every single day into 1,440 individual 60-second broadcast slots.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-8 space-y-4">
            <span className="font-mono text-xs font-bold text-[#ff4e24]">01 / CHOOSE A MINUTE</span>
            <h3 className="text-xl font-bold text-white">Pick Your Slot</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Find an open time slot in our 24-hour UTC matrix, or place an outbid on an already claimed slot.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-8 space-y-4">
            <span className="font-mono text-xs font-bold text-[#ff4e24]">02 / BRAND STUDIO</span>
            <h3 className="text-xl font-bold text-white">Customize Appearance</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Add your product title, tagline, website link, and category. Favicons and theme palettes are auto-detected.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-8 space-y-4">
            <span className="font-mono text-xs font-bold text-[#ff4e24]">03 / BROADCAST DAILY</span>
            <h3 className="text-xl font-bold text-white">Take Over Homepage</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              When the clock hits your minute, your brand takes over the entire homepage for 60 seconds, every single day.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-12 text-center backdrop-blur-xl">
          <span className="font-mono text-xs text-white/50 uppercase tracking-widest">Universal Clock</span>
          <div className="mt-2 font-mono text-5xl font-extrabold text-white">100% UTC</div>
          <p className="mt-4 text-sm text-white/60 max-w-lg mx-auto">
            While we display your local time conversion everywhere, ownership follows one universal clock.
          </p>
          <a href="/explore" className="btn-primary mt-8 inline-flex">
            Find Your Minute Now →
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
