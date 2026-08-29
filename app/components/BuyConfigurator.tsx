"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice, getCheckoutTotal, parseDollarAmountToCents } from "../lib/pricing";
import { minuteIndexToSlug, minuteIndexToTime } from "../lib/time";

export function BuyConfigurator({ startIndex, currentBidCents = null }: { startIndex: number; currentBidCents?: number | null }) {
  const isOutbid = currentBidCents !== null;
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");
  const [checkoutError, setCheckoutError] = useState("");

  // One minute per purchase (multi-minute blocks come later).
  const price = getCheckoutTotal([startIndex]);

  // Bids are whole dollars and must beat the winner by exactly at least $1.
  const minBidCents = isOutbid ? (currentBidCents ?? 0) + 100 : 0;
  const [bidDollars, setBidDollars] = useState<string>(isOutbid ? String(minBidCents / 100) : "");
  const bidCents = parseDollarAmountToCents(bidDollars);
  const bidValid = isOutbid && bidCents !== null && bidCents >= minBidCents;

  function nudgeBid(deltaCents: number) {
    const next = Math.max(minBidCents, (bidCents ?? minBidCents) + deltaCents);
    setBidDollars(String(next / 100));
  }

  async function beginCheckout() {
    setCheckoutState("loading");
    setCheckoutError("");
    try {
      const body = isOutbid ? { minuteIndex: startIndex, bidCents: bidCents ?? 0 } : { minuteIndices: [startIndex] };
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { url?: string; demoUrl?: string; error?: string };
      if (result.url) window.location.assign(result.url);
      else if (result.demoUrl) window.location.assign(result.demoUrl);
      else throw new Error(result.error ?? "Checkout unavailable");
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout unavailable");
      setCheckoutState("error");
    }
  }

  return (
    <div className="buy-layout">
      <section className="buy-summary">
        <span className="eyebrow">{isOutbid ? "YOU ARE OUTBIDDING FOR" : "YOU ARE CLAIMING"}</span>
        <h1>{minuteIndexToTime(startIndex)}</h1>
        <p>
          {isOutbid
            ? "Take over this minute — every day, forever — by beating the current price."
            : "One minute · every day · forever"}
        </p>
        {isOutbid && (
          <div className="current-bid-note">
            <span>CURRENT PRICE</span>
            <strong>{formatPrice(currentBidCents ?? 0)}</strong>
          </div>
        )}
      </section>
      <section className="checkout-panel">
        <div className="benefit-list">
          <span>INCLUDED</span>
          <p>✓ Permanent Buy1Minute page</p>
          <p>✓ Daily 60-second homepage takeover</p>
          <p>✓ Clickable product link</p>
          <p>✓ Public ownership badge</p>
          <p>✓ Privacy-respecting analytics</p>
        </div>
        {isOutbid ? (
          <label className="bid-input">
            <span>YOUR PRICE · MIN {formatPrice(minBidCents)}</span>
            <div className="bid-field">
              <i>$</i>
              <input
                type="text"
                inputMode="numeric"
                value={bidDollars}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^\d]/g, "");
                  setBidDollars(next);
                }}
              />
              <div className="bid-nudge">
                <button type="button" onClick={() => nudgeBid(100)} aria-label="Increase bid by one dollar">▲</button>
                <button type="button" onClick={() => nudgeBid(-100)} aria-label="Decrease bid by one dollar">▼</button>
              </div>
            </div>
            {!bidValid && bidDollars !== "" && <small className="form-error">Enter at least {formatPrice(minBidCents)} (whole dollars).</small>}
          </label>
        ) : (
          <div className="checkout-total">
            <span>TOTAL</span>
            <strong>{price === null ? "AUCTION" : formatPrice(price)}</strong>
            <small>One-time payment. No subscription.</small>
          </div>
        )}
        <button
          className="primary-button"
          type="button"
          disabled={checkoutState === "loading" || (isOutbid ? !bidValid : price === null)}
          onClick={beginCheckout}
        >
          {checkoutState === "loading"
            ? "RESERVING…"
            : isOutbid
              ? `PAY ${bidValid ? formatPrice(bidCents ?? 0) + " " : ""}& CLAIM →`
              : "CONTINUE TO SECURE CHECKOUT →"}
        </button>
        {checkoutState === "error" && <p className="form-error">{checkoutError || "Checkout could not start. Try again."}</p>}
        <small className="checkout-note">One payment gives you one 60-second homepage takeover each day.</small>
        <small className="checkout-note">Complete payment, then publish your name, link, and description.</small>
        <Link className="text-link" href={`/minute/${minuteIndexToSlug(startIndex)}`}>← Back to minute</Link>
      </section>
    </div>
  );
}
