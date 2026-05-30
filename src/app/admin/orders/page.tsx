"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Eye, Package } from "lucide-react";
import { Badge, Pagination } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: { id: string; name: string | null; phone: string | null };
  payment: { method: string; status: string } | null;
  _count: { items: number };
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (status) params.set("status", status);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders);
    setTotalPages(data.pagination.totalPages);
    setTotal(data.pagination.total);
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{total} order{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="min-h-11 w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-black sm:w-auto"
        >
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 lg:hidden">
        {loading ? (
          <div className="border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />No orders found
          </div>
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`} className="block border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold">{order.orderNumber}</p>
                  <p className="mt-1 truncate text-sm text-gray-500">{order.user.name || order.user.phone || "Customer"}</p>
                </div>
                <Badge variant={STATUS_COLORS[order.status] || "default"}>{order.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="block text-xs font-bold uppercase text-gray-400">Total</span>{formatPrice(order.total)}</div>
                <div><span className="block text-xs font-bold uppercase text-gray-400">Items</span>{order._count.items}</div>
                <div><span className="block text-xs font-bold uppercase text-gray-400">Payment</span>{order.payment ? <Badge variant={order.payment.status === "VERIFIED" ? "success" : order.payment.status === "REJECTED" ? "danger" : "warning"}>{order.payment.method}</Badge> : "None"}</div>
                <div><span className="block text-xs font-bold uppercase text-gray-400">Date</span>{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Table */}
      <div className="hidden bg-white border border-gray-200 rounded-lg overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wide text-gray-500">
                <th className="text-left px-6 py-4">Order</th>
                <th className="text-left px-6 py-4">Customer</th>
                <th className="text-center px-6 py-4">Items</th>
                <th className="text-right px-6 py-4">Total</th>
                <th className="text-center px-6 py-4">Payment</th>
                <th className="text-center px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Date</th>
                <th className="text-right px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-medium">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{order.user.name || "—"}</div>
                      <div className="text-xs text-gray-400">{order.user.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-500">{order._count.items}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4 text-center">
                      {order.payment && (
                        <Badge variant={order.payment.status === "VERIFIED" ? "success" : order.payment.status === "REJECTED" ? "danger" : "warning"}>
                          {order.payment.method}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={STATUS_COLORS[order.status] || "default"}>{order.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`}>
                        <button className="p-1.5 text-gray-400 hover:text-black transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}
