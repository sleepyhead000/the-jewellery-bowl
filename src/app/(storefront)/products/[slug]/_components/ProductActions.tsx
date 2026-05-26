"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { usePathname, useRouter } from "next/navigation";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  stock: number;
}

interface Props {
  productId: string;
  variants: Variant[];
  basePrice: number;
  selectedVariantId?: string;
  onVariantChange?: (variantId: string) => void;
}

export default function ProductActions({
  productId,
  variants,
  basePrice,
  selectedVariantId,
  onVariantChange,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { addItem } = useCart();
  const [internalSelectedVariant, setInternalSelectedVariant] = useState(variants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedVariant = selectedVariantId ?? internalSelectedVariant;
  const setSelectedVariant = (variantId: string) => {
    if (onVariantChange) {
      onVariantChange(variantId);
      return;
    }
    setInternalSelectedVariant(variantId);
  };

  const variant = variants.find((v) => v.id === selectedVariant);
  const unitPrice = variant?.salePrice ?? variant?.price ?? basePrice;
  const displayPrice = unitPrice * quantity;
  const inStock = variant ? variant.stock > 0 : false;

  useEffect(() => {
    let active = true;
    const syncWishlistState = async () => {
      try {
        const res = await fetch("/api/wishlist", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as Array<{ productId?: string }>;
        const exists = payload.some((entry) => entry.productId === productId);
        if (active) {
          setWishlisted(exists);
        }
      } catch {
        // Ignore initial sync failures; explicit button action still handles errors.
      }
    };
    syncWishlistState();
    return () => {
      active = false;
    };
  }, [productId]);

  const addToCart = async () => {
    if (!variant) return;
    try {
      setAdding(true);
      setActionError(null);
      const ok = await addItem(variant.id, quantity);
      if (!ok) {
        setActionError("Unable to add product to cart.");
      }
    } catch {
      setActionError("Unable to add product to cart.");
    } finally {
      setAdding(false);
    }
  };

  const addToWishlist = async () => {
    try {
      setWishlistBusy(true);
      setActionError(null);
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) {
        const callbackUrl = encodeURIComponent(pathname || `/products/${productId}`);
        router.push(`/login?callbackUrl=${callbackUrl}`);
        return;
      }
      if (!res.ok) {
        setActionError("Unable to update favorites.");
        return;
      }
      const payload = (await res.json()) as { wishlisted?: boolean };
      setWishlisted(Boolean(payload.wishlisted));
    } catch {
      setActionError("Unable to update favorites.");
    } finally {
      setWishlistBusy(false);
    }
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
                {(v.salePrice ?? v.price) !== basePrice && (
                  <span className="ml-1 text-xs opacity-60">({formatPrice(v.salePrice ?? v.price)})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm font-medium">
        Selected Price ({quantity}): {formatPrice(displayPrice)}
      </p>
      <p className="text-xs text-gray-500">Unit Price: {formatPrice(unitPrice)}</p>

      {variant?.name && (
        <p className="text-xs text-gray-400">
          Variant: <span className="text-gray-600">{variant.name}</span>
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
          className={`p-3 border transition-colors ${
            wishlisted ? "border-black bg-black text-white" : "border-gray-300 hover:border-black"
          }`}
          disabled={wishlistBusy}
          aria-label={wishlisted ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>
      </div>

      {actionError ? <p className="text-xs text-red-500">{actionError}</p> : null}

      {/* Stock info */}
      {variant && variant.stock > 0 && variant.stock <= 5 && (
        <p className="text-xs text-red-500 font-medium">Only {variant.stock} left in stock</p>
      )}
    </div>
  );
}
