import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandIcon } from "../../components/BrandIcon";
import { LogoMark } from "../../components/LogoMark";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { displayHost } from "../../lib/favicon";
import { formatPrice } from "../../lib/pricing";
import { getMinuteState } from "../../lib/seed-data";
import { databaseBinding, getDatabaseMinute } from "../../lib/live-db";
import { minuteIndexToSlug, minuteIndexToTime, parseMinuteSlug } from "../../lib/time";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const index = parseMinuteSlug(slug);
  if (index === null) return { title: "Minute Not Found" };
  const minute = getMinuteState(index);
  return {
    title: minute.owner
      ? `${minute.time} belongs to ${minute.owner.product.name}`
      : `${minute.time} is Available on Buy1Minute`,
    description: minute.owner
      ? `${minute.owner.product.name} owns ${minute.time} UTC permanently.`
      : `Claim ${minute.time} UTC and broadcast daily for 60 seconds.`,
  };
}

export default async function MinutePage({ params }: PageProps) {
  const { slug } = await params;
  const index = parseMinuteSlug(slug);
  if (index === null) {
    notFound();
    return null;
  }

  const minute = getMinuteState(index);
  const live = await getDatabaseMinute(databaseBinding(), index);
  const owner = live?.owner ?? minute.owner;
  const previous = index === 0 ? 1_439 : index - 1;
  const next = index === 1_439 ? 0 : index + 1;

  return (
    <main className="min-h-screen flex flex-col bg-[#08080a]">
      <SiteHeader />

      <div className="flex-1 max-w-[1200px] mx-auto w-full p-8 flex flex-col justify-center">
        {owner ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl font-extrabold text-[#ff4e24]">{minute.time}</span>
                <span className="font-mono text-xs text-white/50">UTC PERMANENT MINUTE</span>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <LogoMark product={owner.product} />
                <h1 className="text-4xl sm:text-6xl font-extrabold text-white">
                  {owner.product.name}
                </h1>
              </div>

              <p className="text-xl text-white/80 mt-4 max-w-xl">{owner.product.tagline}</p>
              <p className="text-sm text-white/60 mt-3 max-w-xl leading-relaxed">
                {owner.product.description}
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <a
                  href={owner.product.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="btn-primary"
                >
                  Visit Website <span>↗</span>
                </a>
                <a
                  href={`/buy/${slug}?outbid=${owner.purchasePriceCents}`}
                  className="btn-secondary"
                >
                  Outbid for {formatPrice(owner.purchasePriceCents + 100)} →
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0f1014] p-8 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="font-mono text-xs text-white/40">OWNERSHIP STATS</span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-400">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-mono text-[10px] text-white/40">WINNING PRICE</span>
                  <div className="font-mono text-xl font-bold text-white">
                    {formatPrice(owner.purchasePriceCents)}
                  </div>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-white/40">TOTAL CLICKS</span>
                  <div className="font-mono text-xl font-bold text-white">
                    {owner.outboundClicks.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="font-mono text-xs text-white/40">DOMAIN</span>
                <span className="font-mono text-xs text-white/80">{displayHost(owner.product.websiteUrl)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center max-w-xl mx-auto py-16">
            <span className="font-mono text-6xl font-extrabold text-white/30">{minute.time}</span>
            <h1 className="text-4xl font-extrabold text-white mt-4">This Minute is Unclaimed.</h1>
            <p className="text-sm text-white/60 mt-2">
              Be the first to claim permanent broadcast rights for {minute.time} UTC.
            </p>

            <div className="mt-8">
              {minute.priceCents === null ? (
                <div className="font-mono text-sm text-yellow-400">AUCTION COMING SOON</div>
              ) : (
                <a href={`/buy/${slug}`} className="btn-primary">
                  Claim for {formatPrice(minute.priceCents)} →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Pager Navigation */}
        <nav className="mt-16 pt-8 border-t border-white/10 grid grid-cols-3 text-center">
          <a
            href={`/minute/${minuteIndexToSlug(previous)}`}
            className="font-mono text-xs text-white/60 hover:text-white"
          >
            ← {minuteIndexToTime(previous)}
          </a>
          <a href="/explore" className="font-mono text-xs text-[#ff4e24] hover:underline">
            All 1,440 Minutes
          </a>
          <a
            href={`/minute/${minuteIndexToSlug(next)}`}
            className="font-mono text-xs text-white/60 hover:text-white"
          >
            {minuteIndexToTime(next)} →
          </a>
        </nav>
      </div>

      <SiteFooter />
    </main>
  );
}
