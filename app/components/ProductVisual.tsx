import type { Product } from "../lib/types";

export function ProductVisual({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div
      className={`product-visual product-visual-${product.visualVariant} ${compact ? "product-visual-compact" : ""}`}
      style={{ "--accent": product.accentColor } as React.CSSProperties}
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
        <strong>{product.shortName}</strong>
      </div>
      <div className="visual-caption">A fictional brand used for preview.</div>
    </div>
  );
}

