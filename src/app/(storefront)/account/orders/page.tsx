"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { Badge, Pagination } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "danger"> = {
  PENDING: "warning", CONFIRMED: "success", PROCESSING: "default",
  SHIPPED: "default", DELIVERED: "success", CANCELLED: "danger", REFUNDED: "danger",
};
const PAYMENT_COLORS: Record<string, "default" | "success" | "warning" | "danger"> = {
  PENDING_VERIFICATION: "warning", VERIFIED: "success", REJECTED: "danger",
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (page: number) => {
    setLoading(true);
    const res = await fetch(`/api/orders?page=${page}&limit=10`);
    const data = await res.json();
    setOrders(data.orders || []);
    setPagination(data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    setLoading(false);
  };

  useEffect(() => { fetchOrders(1); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold uppercase tracking-tight mb-8">My Orders</h1>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet</p>
          <Link href="/products" className="text-sm font-medium underline">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const payment = order.payment as Record<string, unknown> | null;
            return (
              <Link
                key={order.id as string}
                href={`/account/orders/${order.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{order.orderNumber as string}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt as string).toLocaleDateString()} · {(order._count as Record<string, number>)?.items ?? 0} items
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatPrice(order.total as number)}</p>
                      <div className="flex gap-1.5 mt-1 justify-end">
                        <Badge variant={STATUS_COLORS[order.status as string] || "default"} className="text-[10px]">{order.status as string}</Badge>
                        {payment && (
                          <Badge variant={PAYMENT_COLORS[payment.status as string] || "default"} className="text-[10px]">{(payment.status as string).replace("_", " ")}</Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
              </Link>
            );
          })}

          {pagination.pages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={fetchOrders}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
