import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BuyConfigurator } from "../../components/BuyConfigurator";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { getMinuteState } from "../../lib/seed-data";
import { parseMinuteSlug } from "../../lib/time";

export const metadata: Metadata = { title: "Claim your minute" };
type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ outbid?: string }> };

export default async function BuyPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { outbid } = await searchParams;
  const index = parseMinuteSlug(slug);
  if (index === null) notFound();
  const minute = getMinuteState(index);
  const wantsOutbid = outbid !== undefined && minute.status === "owned";
  if (minute.status === "owned" && !wantsOutbid) redirect(`/minute/${slug}`);
  const currentBidCents = wantsOutbid ? minute.owner?.purchasePriceCents ?? null : null;
  return (
    <main className="page-shell buy-page">
      <SiteHeader />
      <div className="buy-kicker">{wantsOutbid ? `OUTBID ${minute.time}` : `CLAIM ${minute.time}`}</div>
      <BuyConfigurator startIndex={index} currentBidCents={currentBidCents} />
      <SiteFooter />
    </main>
  );
}
