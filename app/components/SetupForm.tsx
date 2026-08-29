"use client";

import { useMemo, useState } from "react";
import { BrandIcon } from "./BrandIcon";
import { displayHost } from "../lib/favicon";
import { minuteIndexToTime } from "../lib/time";

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
  name: "Your product",
  websiteUrl: "https://example.com",
  tagline: "The line people will remember.",
  description: "Tell the internet what you make and why it matters.",
  category: "Other",
  accentColor: "#ff4e24",
  xHandle: "",
};

export function SetupForm({ minuteIndex, reservationId }: { minuteIndex: number; reservationId: string | null }) {
  const [form, setForm] = useState(initialForm);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const initials = useMemo(() => form.name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "YM", [form.name]);
  const host = useMemo(() => displayHost(form.websiteUrl), [form.websiteUrl]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const note = `Logo from ${host || "your site"}. Every listing uses the same Buy1Minute theme.`;

  return (
    <div className="setup-layout">
      <form
        className="brand-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          if (!reservationId) { setPublished(true); return; }
          const response = await fetch("/api/listings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reservationId, ...form, xHandle: form.xHandle }) });
          const result = (await response.json()) as { error?: string };
          if (!response.ok) { setError(result.error ?? "Your payment is still being confirmed."); return; }
          setPublished(true);
        }}
      >
        <span className="eyebrow">BRAND SETUP · {minuteIndexToTime(minuteIndex)}</span>
        <h1>Make this minute yours.</h1>
        <div className="form-grid">
          <label><span>PRODUCT NAME</span><input required maxLength={60} value={form.name} onChange={(e) => updateField("name", e.target.value)} /></label>
          <label><span>WEBSITE URL</span><input required type="url" value={form.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} /></label>
          <label className="form-wide"><span>TAGLINE</span><input required maxLength={100} value={form.tagline} onChange={(e) => updateField("tagline", e.target.value)} /></label>
          <label className="form-wide"><span>SHORT DESCRIPTION</span><textarea required maxLength={220} rows={4} value={form.description} onChange={(e) => updateField("description", e.target.value)} /></label>
          <label><span>CATEGORY</span><select required value={form.category} onChange={(e) => updateField("category", e.target.value)}><option>AI</option><option>Design</option><option>Dev tools</option><option>Education</option><option>Finance</option><option>Infrastructure</option><option>Marketing</option><option>Productivity</option><option>Payments</option><option>Shopping</option><option>Social</option><option>Video</option><option>Other</option></select></label>
          <div className="form-wide favicon-field">
            <span className="favicon-field-label">BRAND ICON</span>
            <div className="favicon-preview-row">
              <BrandIcon websiteUrl={form.websiteUrl} fallback={initials} size={128} className="favicon-chip" imgClassName="favicon-chip-img" />
              <small>{note}</small>
            </div>
          </div>
          <label><span>X HANDLE · OPTIONAL</span><input placeholder="@yourproduct" value={form.xHandle} onChange={(e) => updateField("xHandle", e.target.value)} /></label>
        </div>
        <button className="primary-button" type="submit">PUBLISH MY MINUTE →</button>
        <small>Your logo is detected from your website. The Buy1Minute visual theme stays consistent for every product.</small>
        {published && <div className="success-note">Published. Your minute is now live in the Buy1Minute rotation.</div>}
        {error && <div className="form-error">{error}</div>}
      </form>
      <section className="brand-preview" style={{ "--preview-accent": "#ff4e24", "--preview-ink": "#0a0a09" } as React.CSSProperties}>
        <div className="preview-bar"><span>LIVE PREVIEW</span><span>{minuteIndexToTime(minuteIndex)} UTC</span></div>
        <div className="preview-content">
          <span>THIS MINUTE BELONGS TO</span>
          <BrandIcon websiteUrl={form.websiteUrl} fallback={initials} size={128} className="preview-logo-chip" imgClassName="preview-logo-image" />
          <h2>{form.name || "Your product"}</h2>
          <p>{form.tagline}</p>
          <a href={form.websiteUrl || "#"} onClick={(event) => event.preventDefault()}>VISIT ↗</a>
        </div>
        <div className="preview-brandcard">
          <span className="preview-brandcard-top">DAILY TAKEOVER · {minuteIndexToTime(minuteIndex)}</span>
          <BrandIcon websiteUrl={form.websiteUrl} fallback={initials} size={128} className="preview-brand-chip" imgClassName="preview-brand-chip-img" />
          <div className="preview-brandcard-foot">
            <strong>{form.name || "Your product"}</strong>
            <span>{host || "your-site.com"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
