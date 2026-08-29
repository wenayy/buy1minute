"use client";

import { useState } from "react";
import { faviconSources } from "../lib/favicon";

// Renders a brand favicon fetched from its website URL, walking a list of
// favicon providers on error before falling back to the given initials.
export function BrandIcon({
  websiteUrl,
  fallback,
  size = 128,
  className = "",
  imgClassName = "",
}: {
  websiteUrl: string | null | undefined;
  fallback: string;
  size?: number;
  className?: string;
  imgClassName?: string;
}) {
  const sources = faviconSources(websiteUrl, size);
  // Track the URL alongside the source cursor so a URL change (e.g. live
  // preview typing) resets back to the first provider during render.
  const [state, setState] = useState({ url: websiteUrl, index: 0 });
  if (state.url !== websiteUrl) setState({ url: websiteUrl, index: 0 });
  const index = state.url === websiteUrl ? state.index : 0;

  const src = sources[index];
  return (
    <span className={`brand-icon ${className}`.trim()}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={`brand-icon-img ${imgClassName}`.trim()}
          src={src}
          alt=""
          loading="lazy"
          onError={() => setState({ url: websiteUrl, index: index + 1 })}
        />
      ) : (
        <span className="brand-icon-fallback" aria-hidden="true">{fallback}</span>
      )}
    </span>
  );
}
