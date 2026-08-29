import type { Product } from "../lib/types";
import { BrandIcon } from "./BrandIcon";

export function ProductVisual({ product }: { product: Product }) {
  const accent = product.accentColor || "#ff4e24";

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d12] shadow-2xl">
      {/* Ambient background mesh */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl transition-colors duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accent}, transparent 70%)`,
        }}
      />

      {/* Cyber Grid Lines */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Header bar inside preview card */}
      <div className="relative flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          <span className="ml-2 font-mono text-[10px] tracking-wider text-white/50">
            {product.category?.toUpperCase() || "FEATURED PRODUCT"}
          </span>
        </div>
        <span className="font-mono text-[10px] text-white/40">BUY1MINUTE · LIVE TAKEOVER</span>
      </div>

      {/* Hero Showcase Center */}
      <div className="relative flex h-[calc(100%-42px)] flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4">
          <div
            className="absolute -inset-2 rounded-2xl opacity-40 blur-lg"
            style={{ backgroundColor: accent }}
          />
          <BrandIcon
            websiteUrl={product.websiteUrl}
            fallback={product.shortName}
            size={120}
            className="relative h-20 w-20 rounded-2xl bg-white/10 p-1 ring-1 ring-white/20"
            imgClassName="p-3"
          />
        </div>

        <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          {product.name}
        </h3>
        <p className="mt-1 max-w-xs text-xs text-white/70">
          {product.tagline}
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-white/60">
          <span>{product.websiteUrl.replace(/^https?:\/\//, "")}</span>
          <span>↗</span>
        </div>
      </div>
    </div>
  );
}
