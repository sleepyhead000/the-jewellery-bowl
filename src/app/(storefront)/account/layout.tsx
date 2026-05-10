"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, Heart, MapPin, Bell, Shield } from "lucide-react";

const NAV = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
];

const ADMIN_ROLES = ["STAFF", "MANAGER", "ADMIN"];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.role && ADMIN_ROLES.includes(data.role)) setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 shrink-0">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">My Account</h2>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/account" ? pathname === "/account" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    active ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            {isAdmin && (
              <>
                <div className="my-2 border-t border-gray-200" />
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium whitespace-nowrap shrink-0"
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              </>
            )}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
