import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BuyConfigurator } from "../../components/BuyConfigurator";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { getMinuteState } from "../../lib/seed-data";
import { databaseBinding, getDatabaseMinute } from "../../lib/live-db";
import { parseMinuteSlug } from "../../lib/time";

export const metadata: Metadata = { title: "Claim Your Minute" };

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ outbid?: string }>;
};

export default async function BuyPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { outbid } = await searchParams;
  const index = parseMinuteSlug(slug);
  if (index === null) {
    notFound();
    return null;
  }

  const minute = getMinuteState(index);
  const live = await getDatabaseMinute(databaseBinding(), index);
  const owner = live?.owner ?? minute.owner;
  const isOwned = Boolean(owner || live?.bidCents);
  const wantsOutbid = outbid !== undefined && isOwned;

  if (isOwned && !wantsOutbid) {
    redirect(`/minute/${slug}`);
  }

  const currentBidCents = wantsOutbid
    ? live?.bidCents ?? owner?.purchasePriceCents ?? null
    : null;

  return (
    <main className="min-h-screen flex flex-col bg-[#08080a]">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center">
        <BuyConfigurator startIndex={index} currentBidCents={currentBidCents} />
      </div>
      <SiteFooter />
    </main>
  );
}
