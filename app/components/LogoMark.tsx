"use client";

import { useRef } from "react";
import { BrandIcon } from "./BrandIcon";
import type { Product } from "../lib/types";

// Brand favicon on the shared theme chip, with initials fallback.
export function LogoMark({ product, small = false, interactive = false }: { product: Product; small?: boolean; interactive?: boolean }) {
  const markRef = useRef<HTMLSpanElement>(null);
  const move = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!interactive || !markRef.current) return;
    const rect = markRef.current.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    markRef.current.style.setProperty("--logo-dx", `${(x * 7).toFixed(1)}px`);
    markRef.current.style.setProperty("--logo-dy", `${(y * 7).toFixed(1)}px`);
    markRef.current.style.setProperty("--logo-tilt", `${(x * 4).toFixed(1)}deg`);
  };
  const reset = () => {
    if (!markRef.current) return;
    markRef.current.style.setProperty("--logo-dx", "0px");
    markRef.current.style.setProperty("--logo-dy", "0px");
    markRef.current.style.setProperty("--logo-tilt", "0deg");
  };
  return (
    <span
      ref={markRef}
      className={`logo-mark ${small ? "logo-mark-small" : ""} ${interactive ? "logo-mark-interactive" : ""}`}
      onPointerMove={move}
      onPointerLeave={reset}
    >
      <BrandIcon
        websiteUrl={product.websiteUrl}
        fallback={product.shortName}
        size={small ? 64 : 128}
        className="logo-mark-icon"
        imgClassName="logo-mark-favicon"
      />
    </span>
  );
}
