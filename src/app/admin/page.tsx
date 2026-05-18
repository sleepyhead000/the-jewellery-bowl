"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ShoppingCart, Users, DollarSign, AlertTriangle, TrendingUp, CreditCard, Clock } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { adminApiFetch, mapAdminApiError } from "@/lib/admin-api-client";

interface DashboardData {
  stats: {
    todayRevenue: number;
    todayOrders: number;
    pendingOrders: number;
    pendingPayments: number;
    totalCustomers: number;
    totalProducts: number;
  };
  lowStockVariants: Array<{
    id: string;
    sku: string;
    stock: number;
    product: { name: string; slug: string };
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    user: { name: string | null; phone: string | null };
    payment: { status: string; method: string } | null;
  }>;
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "danger"> = {
  PENDING: "warning", CONFIRMED: "success", PROCESSING: "default",
  SHIPPED: "default", DELIVERED: "success", CANCELLED: "danger",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApiFetch<DashboardData>("/api/admin/dashboard")
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(mapAdminApiError(err));
        setData(null);
      });
  }, []);

  if (error) return <div className="text-red-500 text-sm p-6">{error}</div>;
  if (!data) return <div className="text-gray-400 text-sm p-6">Loading dashboard...</div>;

  const { stats, lowStockVariants, recentOrders } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your store</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={DollarSign} label="Today's Revenue" value={formatPrice(stats.todayRevenue)} />
        <StatCard icon={Clock} label="Today's Orders" value={String(stats.todayOrders)} />
        <StatCard icon={ShoppingCart} label="Pending Orders" value={String(stats.pendingOrders)} highlight={stats.pendingOrders > 0} />
        <StatCard icon={CreditCard} label="Pending Payments" value={String(stats.pendingPayments)} highlight={stats.pendingPayments > 0} />
        <StatCard icon={Users} label="Customers" value={String(stats.totalCustomers)} />
        <StatCard icon={Package} label="Products" value={String(stats.totalProducts)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold uppercase text-sm tracking-wide">Low Stock Alerts</h3>
          </div>
          {lowStockVariants.length === 0 ? (
            <p className="text-gray-400 text-sm">All stock levels healthy</p>
          ) : (
            <div className="space-y-2">
              {lowStockVariants.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{v.product.name}</span>
                    <span className="text-gray-400 ml-2">{v.sku}</span>
                  </div>
                  <Badge variant={v.stock === 0 ? "danger" : "warning"}>
                    {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h3 className="font-bold uppercase text-sm tracking-wide">Recent Orders</h3>
            </div>
            <Link href="/admin/orders" className="text-xs text-gray-400 hover:text-black">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between text-sm hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded transition-colors">
                  <div>
                    <span className="font-medium">{order.orderNumber}</span>
                    <span className="text-gray-400 ml-2">{order.user.name || order.user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatPrice(order.total)}</span>
                    <Badge variant={STATUS_COLORS[order.status] || "default"} className="text-[10px]">{order.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-lg border p-5 ${highlight ? "border-amber-300" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className={`text-2xl font-bold ${highlight ? "text-amber-600" : ""}`}>{value}</p>
    </div>
  );
}
