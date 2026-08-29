"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrandIcon } from "./BrandIcon";
import { colorFromString, displayHost, readableTextColor } from "../lib/favicon";
import { minuteIndexToTime } from "../lib/time";

type FormState = {
  name: string;
  websiteUrl: string;
  tagline: string;
  description: string;
  accentColor: string;
  xHandle: string;
};

const DEFAULT_ACCENT = "#ff6a3d";

const initialForm: FormState = {
  name: "Your product",
  websiteUrl: "https://example.com",
  tagline: "The line people will remember.",
  description: "Tell the internet what you make and why it matters.",
  accentColor: DEFAULT_ACCENT,
  xHandle: "",
};

const HEX6 = /^#[0-9a-fA-F]{6}$/;
function safeHex(value: string): string {
  return HEX6.test(value) ? value : DEFAULT_ACCENT;
}

export function SetupForm({ minuteIndex }: { minuteIndex: number }) {
  const [form, setForm] = useState(initialForm);
  const [accentSource, setAccentSource] = useState<"detecting" | "site" | "generated" | "manual">("generated");
  const [published, setPublished] = useState(false);
  // Once the user picks a color by hand, stop auto-overriding it.
  const userPicked = useRef(false);
  const initials = useMemo(() => form.name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "YM", [form.name]);
  const host = useMemo(() => displayHost(form.websiteUrl), [form.websiteUrl]);
  const accent = safeHex(form.accentColor);

  // Auto-detect a starting accent from the site (theme-color, else generated),
  // but always let the user override it with the picker below.
  useEffect(() => {
    // Keep the pleasant default until a real site is entered.
    if (!host || host === "example.com" || userPicked.current) return;
    let cancelled = false;
    setAccentSource("detecting");
    const timer = setTimeout(async () => {
      if (!cancelled && !userPicked.current) {
        setForm((current) => ({ ...current, accentColor: colorFromString(host) }));
        setAccentSource("generated");
      }
      try {
        const response = await fetch(`/api/brand-color?url=${encodeURIComponent(form.websiteUrl)}`);
        const data = (await response.json()) as { color?: string | null };
        if (!cancelled && !userPicked.current && data.color) {
          setForm((current) => ({ ...current, accentColor: data.color as string }));
          setAccentSource("site");
        }
      } catch {
        /* keep generated color */
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [host, form.websiteUrl]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function pickColor(value: string) {
    userPicked.current = true;
    setAccentSource("manual");
    // Always keep a clean "#" + up to 6 hex chars — no malformed values.
    const cleaned = `#${value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6)}`;
    setForm((current) => ({ ...current, accentColor: cleaned }));
  }

  const note =
    accentSource === "detecting"
      ? "Reading your site’s icon and theme color…"
      : accentSource === "manual"
        ? "Custom color. Your icon is still pulled from your site."
        : accentSource === "site"
          ? `Icon and color detected from ${host}. Adjust the color anytime.`
          : `Icon from ${host || "your site"}; color generated. Adjust it anytime.`;

  return (
    <div className="setup-layout">
      <form
        className="brand-form"
        onSubmit={(event) => {
          event.preventDefault();
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
          <div className="form-wide favicon-field">
            <span className="favicon-field-label">BRAND ICON &amp; COLOR</span>
            <div className="favicon-preview-row">
              <BrandIcon websiteUrl={form.websiteUrl} fallback={initials} size={128} className="favicon-chip" imgClassName="favicon-chip-img" />
              <div className="color-input accent-picker">
                <input type="color" value={accent} onChange={(e) => pickColor(e.target.value)} aria-label="Pick accent color" />
                <input value={form.accentColor} maxLength={7} pattern="^#[0-9A-Fa-f]{6}$" onChange={(e) => pickColor(e.target.value)} aria-label="Accent color hex" />
              </div>
              <small>{note}</small>
            </div>
          </div>
          <label><span>X HANDLE · OPTIONAL</span><input placeholder="@yourproduct" value={form.xHandle} onChange={(e) => updateField("xHandle", e.target.value)} /></label>
        </div>
        <button className="primary-button" type="submit">PUBLISH MY MINUTE →</button>
        <small>Your icon is detected from your website; pick any accent color you like.</small>
        {published && <div className="success-note">Preview saved. Connect production storage to publish this listing publicly.</div>}
      </form>
      <section className="brand-preview" style={{ "--preview-accent": accent, "--preview-ink": readableTextColor(accent) } as React.CSSProperties}>
        <div className="preview-bar"><span>LIVE PREVIEW</span><span>{minuteIndexToTime(minuteIndex)} UTC</span></div>
        <div className="preview-content">
          <span>THIS MINUTE BELONGS TO</span>
          <BrandIcon websiteUrl={form.websiteUrl} fallback={initials} size={128} className="preview-logo-chip" imgClassName="preview-logo-image" />
          <h2>{form.name || "Your product"}</h2>
          <p>{form.tagline}</p>
          <a href={form.websiteUrl || "#"} onClick={(event) => event.preventDefault()}>VISIT {(form.name || "site").toUpperCase()} ↗</a>
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
