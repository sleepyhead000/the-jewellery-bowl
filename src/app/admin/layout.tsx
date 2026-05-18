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

const sidebarLinks: Array<{ name: string; href: string; icon: React.ComponentType<{ className?: string }>; permission: Permission }> = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "orders.view" },
  { name: "Products", href: "/admin/products", icon: Package, permission: "products.view" },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart, permission: "orders.view" },
  { name: "Customers", href: "/admin/customers", icon: Users, permission: "customers.view" },
  { name: "Categories", href: "/admin/categories", icon: FolderTree, permission: "categories.manage" },
  { name: "Coupons", href: "/admin/coupons", icon: Tag, permission: "coupons.manage" },
  { name: "Reviews", href: "/admin/reviews", icon: Star, permission: "reviews.moderate" },
  { name: "Staff", href: "/admin/staff", icon: UserCog, permission: "staff.manage" },
  { name: "Reports", href: "/admin/reports", icon: BarChart3, permission: "reports.view" },
  { name: "Notifications", href: "/admin/notifications", icon: Bell, permission: "notifications.send" },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone, permission: "settings.manage" },
  { name: "Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
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
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden md:flex w-64 flex-col bg-gray-950 text-white">
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin" className="text-xl font-bold uppercase tracking-tight">
            TN Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
              >
                <Icon className="h-5 w-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Back to Store
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 bg-white">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-4">
            <button className="relative hover:text-gray-600 transition-colors" type="button" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                !
              </span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
