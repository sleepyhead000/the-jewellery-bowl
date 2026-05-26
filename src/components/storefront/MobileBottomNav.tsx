"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User, Grid2x2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useSearchOverlay } from "@/components/storefront/SearchOverlayProvider";

const links = [
    { href: "/products", label: "Categories", icon: Grid2x2 },
    { href: "/search", label: "Search", icon: Search },
    { href: "/cart", label: "Cart", icon: ShoppingBag },
    { href: "/account", label: "Account", icon: User },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { count } = useCart();
    const { open } = useSearchOverlay();

    return (
        <nav
            className="fixed bottom-2 left-0 right-0 z-50 md:hidden pb-safe px-3"
            style={{
                background: "transparent",
            }}
        >
            <div
                className="h-14 px-2 flex items-center justify-between max-w-md mx-auto rounded-full"
                style={{
                    background: "color-mix(in oklab, #1f1a1a 86%, transparent 14%)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid color-mix(in oklab, #ffffff 18%, transparent 82%)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
                }}
            >
                {links.map(({ href, label, icon: Icon }) => {
                    if (label === "Search") {
                        return (
                            <button
                                key={href}
                                type="button"
                                onClick={open}
                                className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-10 px-2 rounded-2xl transition-all duration-200"
                                style={{
                                    color: "color-mix(in oklab, #f7f0ea 72%, #746764 28%)",
                                    background: "transparent",
                                }}
                                aria-label="Open search"
                            >
                                <span className="relative">
                                    <Icon className="h-4 w-4" strokeWidth={1.7} />
                                </span>
                                <span className="text-[10px] font-medium leading-none">{label}</span>
                            </button>
                        );
                    }

                    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-10 px-2 rounded-2xl transition-all duration-200"
                            style={{
                                color: active ? "#f7f0ea" : "color-mix(in oklab, #f7f0ea 72%, #746764 28%)",
                                background: active ? "color-mix(in oklab, #f7f0ea 10%, #2a2424 90%)" : "transparent",
                                boxShadow: active
                                    ? "0 0 0 1px color-mix(in oklab, #f7f0ea 30%, transparent 70%), 0 6px 14px rgba(0,0,0,0.22)"
                                    : "none",
                            }}
                        >
                            <span className="relative">
                                <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.7} />
                                {label === "Cart" && count > 0 && (
                                    <span
                                        className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold px-1"
                                        style={{ background: "var(--color-danger)", color: "var(--color-accent-contrast)" }}
                                    >
                                        {count > 99 ? "99+" : count}
                                    </span>
                                )}
                            </span>
                            <span className="text-[10px] font-medium leading-none">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
