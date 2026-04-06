"use client";

import { useState } from "react";
import { ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface Props {
  productId: string;
  variants: Variant[];
  basePrice: number;
}

export default function ProductActions({ productId, variants, basePrice }: Props) {
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const variant = variants.find((v) => v.id === selectedVariant);
  const displayPrice = variant?.price || basePrice;
  const inStock = variant ? variant.stock > 0 : false;

  const addToCart = async () => {
    if (!variant) return;
    setAdding(true);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: variant.id, quantity }),
    });
    if (res.ok) {
      // TODO: update cart count in header
    }
    setAdding(false);
  };

  const addToWishlist = async () => {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
  };

  return (
    <div className="space-y-4">
      {/* Variant selector */}
      {variants.length > 1 && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-2">
            Select Variant
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => { setSelectedVariant(v.id); setQuantity(1); }}
                className={`px-4 py-2 text-sm border transition-colors ${
                  v.id === selectedVariant
                    ? "border-black bg-black text-white"
                    : v.stock > 0
                    ? "border-gray-300 hover:border-black"
                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                }`}
                disabled={v.stock <= 0}
              >
                {v.name}
                {v.price !== basePrice && (
                  <span className="ml-1 text-xs opacity-60">({formatPrice(v.price)})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SKU */}
      {variant?.sku && (
        <p className="text-xs text-gray-400">
          SKU: <span className="text-gray-600">{variant.sku}</span>
        </p>
      )}

      {/* Quantity + Cart */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-300">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            −
          </button>
          <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(variant?.stock || 1, q + 1))}
            className="px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            +
          </button>
        </div>

        <Button onClick={addToCart} disabled={!inStock || adding} className="flex-1">
          <ShoppingBag className="h-4 w-4 mr-2" />
          {!inStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
        </Button>

        <button
          onClick={addToWishlist}
          className="p-3 border border-gray-300 hover:border-black transition-colors"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {/* Stock info */}
      {variant && variant.stock > 0 && variant.stock <= 5 && (
        <p className="text-xs text-red-500 font-medium">Only {variant.stock} left in stock</p>
      )}
    </div>
  );
}
