"use client";

import { useState } from "react";
import { faviconSources } from "../lib/favicon";

interface BrandIconProps {
  websiteUrl: string | null | undefined;
  fallback: string;
  size?: number;
  className?: string;
  imgClassName?: string;
}

export function BrandIcon({
  websiteUrl,
  fallback,
  size = 128,
  className = "",
  imgClassName = "",
}: BrandIconProps) {
  const sources = faviconSources(websiteUrl, size);
  const [state, setState] = useState({ url: websiteUrl, index: 0 });

  if (state.url !== websiteUrl) {
    setState({ url: websiteUrl, index: 0 });
  }

  const index = state.url === websiteUrl ? state.index : 0;
  const currentSrc = sources[index];

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm transition-transform ${className}`.trim()}
      style={{ width: `${Math.min(size, 64)}px`, height: `${Math.min(size, 64)}px` }}
    >
      {currentSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={`h-full w-full object-contain p-1.5 transition-opacity duration-200 ${imgClassName}`.trim()}
          src={currentSrc}
          alt=""
          loading="lazy"
          onError={() => setState({ url: websiteUrl, index: index + 1 })}
        />
      ) : (
        <span className="font-mono text-xs font-bold tracking-wider text-white" aria-hidden="true">
          {fallback || "B1"}
        </span>
      )}
    </span>
  );
}
