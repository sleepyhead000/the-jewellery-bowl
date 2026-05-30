"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  Megaphone,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  UserCog,
  Users,
  X,
} from "lucide-react";

export type AdminNavIcon =
  | "dashboard"
  | "products"
  | "orders"
  | "payments"
  | "customers"
  | "categories"
  | "coupons"
  | "reviews"
  | "staff"
  | "reports"
  | "notifications"
  | "announcements"
  | "settings";

export type AdminMobileNavLink = {
  name: string;
  href: string;
  icon: AdminNavIcon;
};

type AdminMobileNavProps = {
  links: AdminMobileNavLink[];
};

const iconMap = {
  dashboard: LayoutDashboard,
  products: Package,
  orders: ShoppingCart,
  payments: CreditCard,
  customers: Users,
  categories: FolderTree,
  coupons: Tag,
  reviews: Star,
  staff: UserCog,
  reports: BarChart3,
  notifications: Bell,
  announcements: Megaphone,
  settings: Settings,
} satisfies Record<AdminNavIcon, React.ComponentType<{ className?: string }>>;

const isActivePath = (pathname: string, href: string): boolean => {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
};

export default function AdminMobileNav({ links }: AdminMobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center border border-[var(--color-border)] bg-[var(--color-elevated)] text-[var(--color-text-primary)]"
        aria-label="Open admin navigation"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/45" role="presentation" onClick={closeMenu}>
          <div
            className="absolute inset-y-0 left-0 flex w-[min(86vw,22rem)] flex-col bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
              <Link
                href="/admin"
                onClick={closeMenu}
                className="text-sm font-bold uppercase tracking-wide"
              >
                Admin
              </Link>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex h-10 w-10 items-center justify-center border border-[var(--color-border)] bg-[var(--color-elevated)]"
                aria-label="Close admin navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              <div className="space-y-1">
                {links.map((link) => {
                  const Icon = iconMap[link.icon];
                  const active = isActivePath(pathname, link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={`flex min-h-11 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-text-primary)]"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-[var(--color-border)] p-3">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex min-h-11 items-center justify-center border border-[var(--color-border)] px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--color-text-primary)]"
              >
                Back to Store
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
