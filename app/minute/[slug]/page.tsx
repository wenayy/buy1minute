import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandIcon } from "../../components/BrandIcon";
import { LogoMark } from "../../components/LogoMark";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { displayHost } from "../../lib/favicon";
import { formatPrice } from "../../lib/pricing";
import { getMinuteState } from "../../lib/seed-data";
import { minuteIndexToSlug, minuteIndexToTime, parseMinuteSlug } from "../../lib/time";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const index = parseMinuteSlug(slug);
  if (index === null) return { title: "Minute not found" };
  const minute = getMinuteState(index);
  return {
    title: minute.owner ? `${minute.time} belongs to ${minute.owner.product.name}` : `${minute.time} is available`,
    description: minute.owner
      ? `${minute.owner.product.name} owns ${minute.time} on Buy1Minute.`
      : `Own ${minute.time} and take over Buy1Minute for 60 seconds every day.`,
  };
}

export default async function MinutePage({ params }: PageProps) {
  const { slug } = await params;
  const index = parseMinuteSlug(slug);
  if (index === null) notFound();
  const minute = getMinuteState(index);
  const previous = index === 0 ? 1_439 : index - 1;
  const next = index === 1_439 ? 0 : index + 1;

  return (
    <main className="page-shell minute-page">
      <SiteHeader />
      {minute.owner ? (
        <section className="minute-detail-owned">
          <div className="minute-title">
            <span className="eyebrow">A PERMANENT MINUTE</span>
            <strong>{minute.time}</strong>
            <span>OWNED BY</span>
          </div>
          <div className="minute-owner-card">
            <div className="owner-heading">
              <LogoMark product={minute.owner.product} />
              <h1>{minute.owner.product.name}</h1>
            </div>
            <p className="takeover-tagline">{minute.owner.product.tagline}</p>
            <p className="takeover-description">{minute.owner.product.description}</p>
            <a className="primary-link" href={minute.owner.product.websiteUrl} target="_blank" rel="noopener noreferrer sponsored">
              Visit {minute.owner.product.name} <span>↗</span>
            </a>
            <Link className="text-link minute-outbid-link" href={`/buy/${slug}?outbid=${minute.owner.purchasePriceCents}`}>
              Outbid for {formatPrice(minute.owner.purchasePriceCents + 100)} →
            </Link>
          </div>
          <a
            className="minute-brand-card"
            href={minute.owner.product.websiteUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            <span className="minute-brand-top">{minute.owner.product.category ?? "FEATURED"}<span>↗</span></span>
            <BrandIcon websiteUrl={minute.owner.product.websiteUrl} fallback={minute.owner.product.shortName} size={256} className="minute-brand-icon" imgClassName="minute-brand-icon-img" />
            <div className="minute-brand-foot">
              <strong>{minute.owner.product.name}</strong>
              <span>{displayHost(minute.owner.product.websiteUrl)}</span>
            </div>
          </a>
          <div className="minute-stats">
            <div><span>OWNED SINCE</span><strong>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(minute.owner.ownedSince))}</strong></div>
            <div><span>PAGE VIEWS</span><strong>{minute.owner.pageViews.toLocaleString()}</strong></div>
            <div><span>TAKEOVER IMPRESSIONS</span><strong>{minute.owner.takeoverImpressions.toLocaleString()}</strong></div>
            <div><span>OUTBOUND CLICKS</span><strong>{minute.owner.outboundClicks.toLocaleString()}</strong></div>
          </div>
        </section>
      ) : (
        <section className="minute-detail-empty">
          <span className="eyebrow">A PERMANENT MINUTE</span>
          <strong>{minute.time}</strong>
          <h1>This minute<br />has no owner.</h1>
          <p>Right now, {minute.time} is just a time. Own it and make it yours every day.</p>
          {minute.priceCents === null ? (
            <div className="auction-notice"><span>{minute.pricingLabel}</span><strong>AUCTION COMING SOON</strong></div>
          ) : (
            <Link className="primary-link" href={`/buy/${slug}`}>Own {minute.time} for {formatPrice(minute.priceCents)} <span>→</span></Link>
          )}
        </section>
      )}
      <nav className="minute-pager" aria-label="Previous and next minute">
        <Link href={`/minute/${minuteIndexToSlug(previous)}`}><span>← PREVIOUS</span><strong>{minuteIndexToTime(previous)}</strong></Link>
        <Link href="/explore"><span>ALL MINUTES</span><strong>1,440</strong></Link>
        <Link href={`/minute/${minuteIndexToSlug(next)}`}><span>NEXT →</span><strong>{minuteIndexToTime(next)}</strong></Link>
      </nav>
      <SiteFooter />
    </main>
  );
}
