"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils";
import ProductImages from "./ProductImages";
import ProductActions from "./ProductActions";

type Variant = {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  stock: number;
};

type ProductImage = {
  url: string;
  variantId: string | null;
};

type ProductDetailInteractiveProps = {
  productId: string;
  productName: string;
  categoryName: string | null;
  description: string | null;
  basePrice: number;
  variants: Variant[];
  images: ProductImage[];
  tags: string[];
};

export default function ProductDetailInteractive(props: ProductDetailInteractiveProps) {
  const { productId, productName, categoryName, description, basePrice, variants, images, tags } = props;
  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id ?? "");

  const selectedVariant = useMemo(
    () => variants.find((entry) => entry.id === selectedVariantId),
    [selectedVariantId, variants]
  );

  const displayPrice = selectedVariant?.salePrice ?? selectedVariant?.price ?? basePrice;

  const variantSpecificImages = images.filter((image) => image.variantId === selectedVariantId);
  const fallbackImages = images.filter((image) => image.variantId == null);
  const resolvedImages =
    variantSpecificImages.length > 0
      ? variantSpecificImages
      : fallbackImages.length > 0
      ? fallbackImages
      : images;
  const selectedImages = resolvedImages.map((image) => image.url);

  return (
    <>
      <ProductImages images={selectedImages} name={productName} />

      <div className="space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight leading-tight text-[var(--color-product-title)]">{productName}</h1>
          {categoryName && (
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mt-1">{categoryName}</p>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl font-bold text-[var(--color-product-price)]">{formatPrice(displayPrice)}</span>
          {selectedVariant?.salePrice ? (
            <span className="text-sm text-[var(--color-product-compare-price)] line-through">{formatPrice(selectedVariant.price)}</span>
          ) : null}
        </div>

        {description && <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{description}</p>}

        <ProductActions
          productId={productId}
          variants={variants}
          basePrice={basePrice}
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
        />

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] border border-[var(--color-border)] px-2 py-1">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
