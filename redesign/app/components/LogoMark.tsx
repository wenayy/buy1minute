import { BrandIcon } from "./BrandIcon";
import type { Product } from "../lib/types";

export function LogoMark({ product, small = false }: { product: Product; small?: boolean }) {
  const size = small ? 38 : 56;
  return (
    <span
      className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-white/15 to-white/5 p-0.5 shadow-lg backdrop-blur-md ring-1 ring-white/20 transition-transform duration-300 hover:scale-105`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <BrandIcon
        websiteUrl={product.websiteUrl}
        fallback={product.shortName}
        size={size * 2}
        className="h-full w-full rounded-[14px] bg-[#0c0d12]"
        imgClassName="p-2"
      />
    </span>
  );
}
