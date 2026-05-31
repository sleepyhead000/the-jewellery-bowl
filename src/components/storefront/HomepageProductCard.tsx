"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

type HomepageProductCardProps = {
    id: string;
    slug: string;
    name: string;
    image: string;
    price: number;
    salePrice?: number;
    variantId?: string;
};

export default function HomepageProductCard(props: HomepageProductCardProps) {
    const { id, slug, name, image, price, salePrice, variantId } = props;
    const { addItem } = useCart();
    const [adding, setAdding] = useState<boolean>(false);
    const hasSale = salePrice != null && salePrice < price;

    const onAdd = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (!variantId || adding) return;
        setAdding(true);
        await addItem(variantId);
        setAdding(false);
    };

    return (
        <Link href={`/products/${slug || id}`} className="block w-[64%] mx-auto">
            <div
                className="border-[4px] bg-[var(--color-elevated)]"
                style={{ borderColor: "var(--color-product-card-border)" }}
            >
                <div className="relative aspect-[4/5]">
                    <Image src={image} alt={name} fill unoptimized className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
            </div>
            <div className="pt-2 px-1">
                <p className="text-xs text-[var(--color-text-muted)]">Bangles</p>
                <h3 className="text-sm md:text-base font-medium leading-tight text-[var(--color-text-primary)]">{name}</h3>
                <div className="mt-1 text-xs md:text-sm text-[var(--color-text-secondary)]">
                    {hasSale ? (
                        <>
                            <span className="line-through mr-2">BDT {price.toLocaleString()}</span>
                            <span>BDT {salePrice?.toLocaleString()}</span>
                        </>
                    ) : (
                        <span>BDT {price.toLocaleString()}</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    disabled={!variantId || adding}
                    className="mt-2 border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] disabled:opacity-60"
                >
                    {adding ? "Adding..." : "Add to Cart"}
                </button>
            </div>
        </Link>
    );
}
