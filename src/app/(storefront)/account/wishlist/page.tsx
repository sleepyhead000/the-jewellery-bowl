"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

export default function WishlistPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false); });
  }, []);

  const removeItem = async (productId: string) => {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setItems((prev) => prev.filter((i) => (i.productId as string) !== productId));
  };

  if (loading) return <div className="text-[var(--color-text-muted)] text-sm">Loading wishlist...</div>;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight mb-6 sm:mb-8">Wishlist</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] mb-4">Your wishlist is empty</p>
          <Link href="/products" className="text-sm font-medium underline">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {items.map((item) => {
            const product = item.product as Record<string, unknown>;
            const images = product.images as Array<Record<string, unknown>>;
            const variants = product.variants as Array<Record<string, unknown>>;
            const price = variants?.[0]?.basePrice as number | undefined;

            return (
              <div key={item.id as string} className="border border-[var(--color-border)] overflow-hidden group bg-[var(--color-elevated)]">
                <Link href={`/products/${product.slug}`}>
                  <div
                    className="aspect-[4/5] bg-[var(--color-elevated)] relative overflow-hidden border-[4px]"
                    style={{ borderColor: "var(--color-product-card-border)" }}
                  >
                    {images?.[0] ? (
                      <Image
                        src={images[0].url as string}
                        alt={product.name as string}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                        <ShoppingBag className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="text-sm font-medium hover:underline line-clamp-2 text-[var(--color-product-title)]">{product.name as string}</h3>
                  </Link>
                  {price && <p className="text-sm text-[var(--color-product-price)] mt-1">{formatPrice(price)}</p>}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.productId as string)}
                    className="mt-3 w-full text-red-500 border-red-200 hover:bg-red-50 min-h-10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
