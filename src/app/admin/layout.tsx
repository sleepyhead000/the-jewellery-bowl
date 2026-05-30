import Link from "next/link";
import type React from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Tag,
  Star,
  UserCog,
  BarChart3,
  Bell,
  Settings,
  Megaphone,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import ThemeToggle from "@/components/theme/ThemeToggle";
import AdminMobileNav, { type AdminNavIcon } from "./_components/AdminMobileNav";

const adminIconMap = {
  dashboard: LayoutDashboard,
  products: Package,
  orders: ShoppingCart,
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

const sidebarLinks: Array<{ name: string; href: string; icon: AdminNavIcon; permission: Permission }> = [
  { name: "Dashboard", href: "/admin", icon: "dashboard", permission: "orders.view" },
  { name: "Products", href: "/admin/products", icon: "products", permission: "products.view" },
  { name: "Orders", href: "/admin/orders", icon: "orders", permission: "orders.view" },
  { name: "Customers", href: "/admin/customers", icon: "customers", permission: "customers.view" },
  { name: "Categories", href: "/admin/categories", icon: "categories", permission: "categories.manage" },
  { name: "Coupons", href: "/admin/coupons", icon: "coupons", permission: "coupons.manage" },
  { name: "Reviews", href: "/admin/reviews", icon: "reviews", permission: "reviews.moderate" },
  { name: "Staff", href: "/admin/staff", icon: "staff", permission: "staff.manage" },
  { name: "Reports", href: "/admin/reports", icon: "reports", permission: "reports.view" },
  { name: "Notifications", href: "/admin/notifications", icon: "notifications", permission: "notifications.send" },
  { name: "Announcements", href: "/admin/announcements", icon: "announcements", permission: "settings.manage" },
  { name: "Settings", href: "/admin/settings", icon: "settings", permission: "settings.manage" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;
  const visibleLinks = role
    ? sidebarLinks.filter((link) => hasPermission(role, link.permission))
    : [];

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <aside className="hidden md:flex w-64 flex-col bg-[var(--color-surface)] text-[var(--color-text-primary)] border-r border-[var(--color-border)]">
        <div className="p-6 border-b border-[var(--color-border)]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
          >
            Back to Website
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleLinks.map((link) => {
            const Icon = adminIconMap[link.icon];
            return (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Icon className="h-5 w-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--color-border)]">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Back to Store
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[var(--color-border)] flex items-center justify-between px-4 sm:px-6 bg-[var(--color-elevated)]">
          <div className="flex items-center gap-3">
            <AdminMobileNav links={visibleLinks.map(({ name, href, icon }) => ({ name, href, icon }))} />
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight">Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="relative transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" type="button" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] text-white flex items-center justify-center font-bold bg-[var(--color-danger)]">
                !
              </span>
            </button>
            <div className="h-8 w-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-xs font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 bg-[var(--color-bg)] overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
