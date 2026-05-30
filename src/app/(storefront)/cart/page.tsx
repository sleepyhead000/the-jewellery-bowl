"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui";

export default function CartPage() {
  const { items, total, loading, updateQuantity, removeItem } = useCart();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight mb-6 sm:mb-8">Shopping Cart</h1>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 pb-28 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 text-sm mb-6">Explore our collection and find something you love.</p>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-12 pb-28 md:pb-12">
      <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight mb-6 sm:mb-8">
        Shopping Cart ({items.length})
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Items */}
        <div className="flex-1 space-y-4">
          {items.map((item) => {
            const attrs = item.variant.attributes as Record<string, string>;
            return (
              <div
                key={item.id}
                className="flex gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg"
              >
                {/* Image */}
                <div className="relative h-[72px] w-[72px] sm:w-20 sm:h-20 shrink-0 bg-gray-100 rounded overflow-hidden">
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="text-sm font-medium hover:underline block line-clamp-2"
                  >
                    {item.product.name}
                  </Link>
                  {Object.keys(attrs).length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">SKU: {item.variant.sku}</p>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-3">
                    {/* Quantity */}
                    <div className="flex h-10 w-full items-center justify-between border border-gray-300 sm:w-auto">
                      <button
                        onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                        className="h-full min-w-10 px-2.5 text-sm hover:bg-gray-50"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 text-sm font-medium min-w-[2.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, Math.min(item.variant.stock, item.quantity + 1))}
                        className="h-full min-w-10 px-2.5 text-sm hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-left sm:text-right">
                      <span className="text-sm font-medium">
                        {formatPrice(item.variant.price * item.quantity)}
                      </span>
                      {item.variant.originalPrice && (
                        <span className="text-xs text-gray-400 line-through ml-2">
                          {formatPrice(item.variant.originalPrice * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="self-start p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 space-y-4 lg:sticky lg:top-4">
            <h2 className="text-sm font-bold uppercase tracking-wide">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-400 text-xs">Calculated at checkout</span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between text-sm font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Link href="/checkout" className="block">
              <Button className="w-full">
                Checkout <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link
              href="/products"
              className="block text-center text-xs text-gray-500 hover:text-black transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
