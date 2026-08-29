"use client";

import { useMemo, useState } from "react";
import { BrandIcon } from "./BrandIcon";
import { displayHost } from "../lib/favicon";
import { minuteIndexToSlug, minuteIndexToTime } from "../lib/time";
import { CATEGORY_OPTIONS } from "../lib/categories";

type FormState = {
  name: string;
  websiteUrl: string;
  tagline: string;
  description: string;
  category: string;
  accentColor: string;
  xHandle: string;
};

const initialForm: FormState = {
  name: "My Brand",
  websiteUrl: "https://example.com",
  tagline: "The fastest way to build on the internet.",
  description: "Share what makes your project unique and why visitors should discover you.",
  category: "Dev tools",
  accentColor: "#ff4e24",
  xHandle: "",
};

export function SetupForm({
  minuteIndex,
  reservationId,
}: {
  minuteIndex: number;
  reservationId: string | null;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");

  const initials = useMemo(
    () =>
      form.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "MB",
    [form.name]
  );

  const host = useMemo(() => displayHost(form.websiteUrl), [form.websiteUrl]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((curr) => ({ ...curr, [key]: value }));
  }

  return (
    <div className="max-w-[1280px] mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-12">
      {/* Setup Form Left */}
      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setSubmitting(true);

          if (!reservationId) {
            setPublished(true);
            setTimeout(() => {
              window.location.assign(`/minute/${minuteIndexToSlug(minuteIndex)}`);
            }, 600);
            return;
          }

          try {
            const response = await fetch("/api/listings", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ reservationId, ...form }),
            });

            const result = (await response.json()) as { error?: string };
            if (!response.ok) {
              setError(result.error ?? "Could not publish minute.");
              setSubmitting(false);
              return;
            }

            setPublished(true);
            setTimeout(() => {
              window.location.assign(`/minute/${minuteIndexToSlug(minuteIndex)}`);
            }, 600);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Submission error");
            setSubmitting(false);
          }
        }}
      >
        <div>
          <span className="eyebrow text-[#ff4e24]">
            CUSTOMIZE YOUR MINUTE · {minuteIndexToTime(minuteIndex)} UTC
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Creator Studio</h1>
          <p className="text-sm text-white/60 mt-1">
            Configure how your brand appears on the live homepage takeover and the permanent minute archive.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-xs text-white/60 mb-2">PRODUCT NAME</label>
            <input
              required
              maxLength={60}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-white/60 mb-2">WEBSITE URL</label>
            <input
              required
              type="url"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
              value={form.websiteUrl}
              onChange={(e) => updateField("websiteUrl", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs text-white/60 mb-2">TAGLINE (MAX 100 CHARS)</label>
          <input
            required
            maxLength={100}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
            value={form.tagline}
            onChange={(e) => updateField("tagline", e.target.value)}
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-white/60 mb-2">DESCRIPTION (MAX 240 CHARS)</label>
          <textarea
            required
            maxLength={240}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-xs text-white/60 mb-2">CATEGORY</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-[#08080a] px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-xs text-white/60 mb-2">TWITTER / X HANDLE</label>
            <input
              placeholder="@handle"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
              value={form.xHandle}
              onChange={(e) => updateField("xHandle", e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full h-14 text-sm"
        >
          {submitting ? "PUBLISHING TO THE INTERNET…" : "PUBLISH MINUTE →"}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {published && (
          <p className="text-sm text-emerald-400">
            ✓ Published successfully! Redirecting to your minute...
          </p>
        )}
      </form>

      {/* Right Live Preview Canvas */}
      <div className="space-y-6">
        <div>
          <span className="eyebrow">LIVE TAKEOVER PREVIEW</span>
          <div className="mt-3 rounded-2xl border border-white/15 bg-[#0f1014] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <BrandIcon
                websiteUrl={form.websiteUrl}
                fallback={initials}
                size={48}
                className="h-12 w-12 rounded-xl bg-white/10"
              />
              <div>
                <h3 className="font-bold text-white text-lg">{form.name || "Brand Name"}</h3>
                <span className="font-mono text-xs text-white/40">{host || "example.com"}</span>
              </div>
            </div>

            <p className="font-bold text-white text-sm">{form.tagline}</p>
            <p className="mt-2 text-xs text-white/60">{form.description}</p>

            <div className="mt-6 flex justify-between items-center pt-4 border-t border-white/10">
              <span className="font-mono text-xs text-emerald-400">
                ● {minuteIndexToTime(minuteIndex)} UTC BROADCAST
              </span>
              <span className="font-mono text-xs text-white/40">{form.category}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
