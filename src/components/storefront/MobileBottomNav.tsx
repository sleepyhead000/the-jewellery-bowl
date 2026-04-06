"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account", label: "Account", icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-md border-t border-gray-100 pb-safe">
      <div className="flex justify-around items-center h-14 px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 min-w-[48px] py-1 transition-colors ${
                active ? "text-black" : "text-gray-400"
              }`}
            >
              <span className="relative">
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.5 : 1.5}
                />
                {label === "Cart" && count > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-sale rounded-full flex items-center justify-center text-[9px] text-white font-bold px-1">
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
