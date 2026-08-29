import { BrandIcon } from "./BrandIcon";
import type { Product } from "../lib/types";

// Brand favicon on the shared theme chip, with initials fallback.
export function LogoMark({ product, small = false }: { product: Product; small?: boolean }) {
  return (
    <span
      className={`logo-mark ${small ? "logo-mark-small" : ""}`}
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
