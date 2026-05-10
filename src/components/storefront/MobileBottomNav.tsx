"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User, Grid2x2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

const links = [
    { href: "/products", label: "Categories", icon: Grid2x2 },
    { href: "/search", label: "Search", icon: Search },
    { href: "/cart", label: "Cart", icon: ShoppingBag },
    { href: "/account", label: "Account", icon: User },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { count } = useCart();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
            style={{
                background: "rgba(13,13,13,0.96)",
                backdropFilter: "blur(12px)",
                borderTop: "1px solid rgba(201,168,76,0.18)",
            }}
        >
            <div className="h-16 px-2 flex items-center justify-between max-w-md mx-auto">
                {links.map(({ href, label, icon: Icon }) => {
                    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center gap-0.5 min-w-[48px] py-1 transition-colors duration-200"
                            style={{ color: active ? "#C9A84C" : "#7a6e58" }}
                        >
                            <span className="relative">
                                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
                                {label === "Cart" && count > 0 && (
                                    <span
                                        className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold px-1"
                                        style={{ background: "#8B1A1A", color: "#E8D9B0" }}
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
