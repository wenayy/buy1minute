"use client";

import { useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function ReportPage() {
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function parseTimeToIndex(t: string): number | null {
    const match = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(t.trim());
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const minuteIndex = parseTimeToIndex(time);
    if (minuteIndex === null) {
      setError("Please enter a valid time in HH:MM format (e.g. 14:30).");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          minuteIndex,
          reason,
          details,
          reporterEmail: email,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Failed to submit report.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);
    } catch {
      setError("Submission network error.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#08080a]">
      <SiteHeader />

      <div className="flex-1 max-w-[640px] mx-auto w-full p-8 flex flex-col justify-center">
        <span className="eyebrow text-[#ff4e24]">SAFETY & TRUST</span>
        <h1 className="text-3xl font-extrabold text-white mt-1">Report a Listing</h1>
        <p className="text-sm text-white/60 mt-2">
          If a minute features deceptive, malicious, explicit, or copyright-infringing content, report it immediately to our moderation team.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
            <h3 className="text-lg font-bold text-emerald-400">Report Received</h3>
            <p className="text-xs text-white/70 mt-1">
              Thank you for keeping Buy1Minute safe. Our moderation team will review this listing.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block font-mono text-xs text-white/60 mb-2">
                MINUTE (UTC TIME, e.g. 14:37)
              </label>
              <input
                required
                placeholder="14:37"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-white/60 mb-2">REASON</label>
              <select
                required
                className="w-full rounded-xl border border-white/10 bg-[#08080a] px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="" disabled>Select a reason</option>
                <option>Phishing or malware</option>
                <option>Hate or harassment</option>
                <option>Explicit content</option>
                <option>Impersonation</option>
                <option>Other policy violation</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs text-white/60 mb-2">DETAILS</label>
              <textarea
                required
                rows={4}
                maxLength={1000}
                placeholder="Explain the issue with this listing..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-white/60 mb-2">YOUR EMAIL</label>
              <input
                required
                type="email"
                placeholder="you@domain.com"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full h-12"
            >
              {submitting ? "SUBMITTING REPORT…" : "SUBMIT REPORT →"}
            </button>
          </form>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}
