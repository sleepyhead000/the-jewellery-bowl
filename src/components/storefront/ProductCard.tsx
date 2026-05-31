"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";

interface ProductCardProps {
    id: string;
    slug?: string;
    name: string;
    image: string;
    price: number;
    salePrice?: number;
    variantId?: string;
    isNew?: boolean;
}

function toTitleCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProductCard({ id, slug, name, image, price, salePrice, variantId, isNew }: ProductCardProps) {
    const { addItem } = useCart();
    const [adding, setAdding] = useState(false);

    const handleQuickAdd = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!variantId || adding) return;
        setAdding(true);
        await addItem(variantId);
        setAdding(false);
    };

    const hasSale = salePrice != null && salePrice < price;
    const discountPct = hasSale ? Math.round(((price - salePrice) / price) * 100) : 0;

    return (
        <Link href={`/products/${slug || id}`} className="group block min-w-0">
            <div
                className="relative aspect-[4/5] overflow-hidden border-[4px] bg-[var(--color-elevated)] mb-3 md:mb-4"
                style={{ borderColor: "var(--color-product-card-border)" }}
            >
                {/* Dynamic Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                    {hasSale && (
                        <span className="bg-sale text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wide">
                            {discountPct}% Off
                        </span>
                    )}
                    {isNew && (
                        <span className="bg-accent text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wide">
                            New
                        </span>
                    )}
                </div>

                {/* Image */}
                <Image
                    src={image}
                    alt={name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                {/* Quick Add Button — desktop: hover reveal, mobile: persistent icon */}
                {variantId && (
                    <>
                        {/* Desktop hover button */}
                        <button
                            onClick={handleQuickAdd}
                            disabled={adding}
                            className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-10 items-center gap-2 bg-white/90 backdrop-blur-sm text-black px-5 py-2.5 text-xs font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white disabled:opacity-50"
                        >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            {adding ? "Adding..." : "Quick Add"}
                        </button>
                        {/* Mobile persistent icon button */}
                        <button
                            onClick={handleQuickAdd}
                            disabled={adding}
                            className="md:hidden absolute bottom-2.5 right-2.5 z-10 w-11 h-11 bg-[var(--color-elevated)]/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform disabled:opacity-50 hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-contrast)]"
                        >
                            <ShoppingBag className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            <div className="space-y-1.5 text-center">
                <h3 className="text-[13px] sm:text-sm font-medium tracking-wide line-clamp-2 md:truncate leading-snug text-[var(--color-product-title)]">{toTitleCase(name)}</h3>
                <div className="text-[11px] sm:text-xs font-medium space-x-1.5 sm:space-x-2">
                    {hasSale ? (
                        <>
                            <span className="text-[var(--color-product-sale-price)]">BDT {salePrice.toLocaleString()}</span>
                            <span className="line-through text-[var(--color-product-compare-price)]">
                                BDT {price.toLocaleString()}
                            </span>
                        </>
                    ) : (
                        <span className="text-[var(--color-product-price)]">BDT {price.toLocaleString()}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
