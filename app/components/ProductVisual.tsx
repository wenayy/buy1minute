import type { Product } from "../lib/types";
import { BrandIcon } from "./BrandIcon";

export function ProductVisual({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div
      className={`product-visual product-visual-fixed ${compact ? "product-visual-compact" : ""}`}
      style={{ "--accent": "#ff4e24" } as React.CSSProperties}
      aria-label={`${product.name} product preview`}
    >
      <div className="visual-topline">
        <span>{product.name}</span>
        <span>DEMO / 2026</span>
      </div>
      <div className="visual-canvas">
        <span className="visual-orb visual-orb-a" />
        <span className="visual-orb visual-orb-b" />
        <span className="visual-line visual-line-a" />
        <span className="visual-line visual-line-b" />
        <BrandIcon websiteUrl={product.websiteUrl} fallback={product.shortName} size={256} className="visual-brand-icon" imgClassName="visual-brand-icon-img" />
        <strong>{product.name}</strong>
      </div>
      <div className="visual-caption">A fictional brand used for preview.</div>
    </div>
  );
}
