"use client";

import { useState } from "react";
import { formatPrice, getCheckoutTotal, parseDollarAmountToCents } from "../lib/pricing";
import { minuteIndexToSlug, minuteIndexToTime } from "../lib/time";

export function BuyConfigurator({
  startIndex,
  currentBidCents = null,
}: {
  startIndex: number;
  currentBidCents?: number | null;
}) {
  const isOutbid = currentBidCents !== null;
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");
  const [checkoutError, setCheckoutError] = useState("");

  const price = getCheckoutTotal([startIndex]);
  const minBidCents = isOutbid ? (currentBidCents ?? 0) + 100 : 0;
  const [bidDollars, setBidDollars] = useState<string>(isOutbid ? String(minBidCents / 100) : "");
  const bidCents = parseDollarAmountToCents(bidDollars);
  const bidValid = isOutbid && bidCents !== null && bidCents >= minBidCents;

  function nudgeBid(deltaDollars: number) {
    const current = bidCents !== null ? bidCents / 100 : minBidCents / 100;
    const next = Math.max(minBidCents / 100, current + deltaDollars);
    setBidDollars(String(next));
  }

  async function beginCheckout() {
    setCheckoutState("loading");
    setCheckoutError("");
    try {
      const body = isOutbid
        ? { minuteIndex: startIndex, bidCents: bidCents ?? 0 }
        : { minuteIndices: [startIndex] };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = (await response.json()) as { url?: string; demoUrl?: string; error?: string };

      if (result.url) {
        window.location.assign(result.url);
      } else if (result.demoUrl) {
        window.location.assign(result.demoUrl);
      } else {
        throw new Error(result.error ?? "Checkout initialization failed");
      }
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout unavailable");
      setCheckoutState("error");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-12 max-w-[1240px] mx-auto w-full p-6 sm:p-12">
      {/* Left Summary */}
      <div className="flex flex-col justify-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-white/70 w-max">
          <span className="w-2 h-2 rounded-full bg-[#ff4e24] animate-pulse"></span>
          <span>{isOutbid ? "OUTBIDDING WINNING POSITION" : "CLAIMING OPEN MINUTE"}</span>
        </div>

        <h1 className="font-mono text-6xl sm:text-8xl font-black tracking-tighter text-white">
          {minuteIndexToTime(startIndex)} <span className="text-2xl text-white/40">UTC</span>
        </h1>

        <p className="text-lg text-white/70 max-w-lg leading-relaxed">
          {isOutbid
            ? "Outbid the current holder to take over this minute. Your brand broadcasts to every visitor for 60 seconds every day until someone outbids you."
            : "Claim permanent ownership of this 60-second broadcast slot in the global UTC day."}
        </p>

        {isOutbid && (
          <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-6 space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-white/40">CURRENT WINNING BID</span>
            <div className="font-mono text-4xl font-extrabold text-white">
              {formatPrice(currentBidCents ?? 0)}
            </div>
            <p className="font-mono text-xs text-emerald-400">
              Minimum outbid required: +$1.00 USD
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10 font-mono text-xs text-white/80">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span> Daily 60s broadcast
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span> Direct outbound dofollow link
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span> Verified domain chip
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span> Real-time click analytics
          </div>
        </div>
      </div>

      {/* Right Instant Action Card */}
      <div className="rounded-3xl border border-white/15 bg-[#0f1014] p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-8">
        <div>
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <span className="font-mono text-xs text-white/60 uppercase tracking-wider">Fast Checkout</span>
            <span className="font-mono text-xs text-emerald-400 font-bold">● 10-MIN SLOT LOCK</span>
          </div>

          {isOutbid ? (
            <div className="mt-6 space-y-4">
              <label className="block font-mono text-xs text-white/60">
                SET YOUR BID AMOUNT (MIN {formatPrice(minBidCents)})
              </label>

              <div className="relative flex items-center rounded-2xl border border-white/20 bg-black/60 px-4 py-3 shadow-inner">
                <span className="font-mono text-3xl text-white/40 mr-2">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full bg-transparent font-mono text-4xl font-extrabold text-white outline-none"
                  value={bidDollars}
                  onChange={(e) => setBidDollars(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>

              {/* Quick Nudge Buttons */}
              <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => nudgeBid(1)}
                  className="py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                  +$1
                </button>
                <button
                  type="button"
                  onClick={() => nudgeBid(5)}
                  className="py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                  +$5
                </button>
                <button
                  type="button"
                  onClick={() => nudgeBid(25)}
                  className="py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                  +$25
                </button>
                <button
                  type="button"
                  onClick={() => nudgeBid(100)}
                  className="py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                  +$100
                </button>
              </div>

              {!bidValid && bidDollars !== "" && (
                <p className="text-xs text-red-400 font-mono">
                  Enter at least {formatPrice(minBidCents)} (whole dollars).
                </p>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              <span className="font-mono text-xs text-white/60 uppercase">Total Checkout Amount</span>
              <div className="font-mono text-5xl font-black text-white">
                {price === null ? "AUCTION" : formatPrice(price)}
              </div>
              <p className="text-xs text-white/50">
                One-time pay-to-rank transaction. No recurring subscription.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button
            type="button"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#ff4e24] to-[#ff6b3d] hover:opacity-90 text-white font-mono text-sm font-bold uppercase tracking-wider shadow-xl shadow-[#ff4e24]/30 transition-all disabled:opacity-40"
            disabled={checkoutState === "loading" || (isOutbid ? !bidValid : price === null)}
            onClick={beginCheckout}
          >
            {checkoutState === "loading"
              ? "RESERVING SLOT LOCK…"
              : isOutbid
              ? `OUTBID & PAY ${bidValid ? formatPrice(bidCents ?? 0) : ""} →`
              : "CLAIM MINUTE →"}
          </button>

          {checkoutState === "error" && (
            <p className="text-center text-xs text-red-400 font-mono">
              {checkoutError || "Checkout could not be initialized."}
            </p>
          )}

          <div className="text-center">
            <a
              href={`/minute/${minuteIndexToSlug(startIndex)}`}
              className="font-mono text-xs text-white/40 hover:text-white"
            >
              ← Cancel & return to minute
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
