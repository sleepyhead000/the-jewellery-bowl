"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, CheckCircle, Truck, Package, XCircle } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "danger"> = {
  PENDING: "warning", CONFIRMED: "success", PROCESSING: "default",
  SHIPPED: "default", DELIVERED: "success", CANCELLED: "danger", REFUNDED: "danger",
};

const TIMELINE_ICONS: Record<string, typeof Clock> = {
  PENDING: Clock, CONFIRMED: CheckCircle, PROCESSING: Package,
  SHIPPED: Truck, DELIVERED: CheckCircle, CANCELLED: XCircle,
};

const STATUS_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function CustomerOrderDetailPage({ params }: Props) {
  const { id } = use(params);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => { setOrder(data); setLoading(false); });
  }, [id]);

  if (loading) return <div className="text-gray-400 text-sm">Loading order...</div>;
  if (!order || order.error) return <div className="text-gray-400 text-sm">Order not found</div>;

  const payment = order.payment as Record<string, unknown> | null;
  const items = order.items as Array<Record<string, unknown>>;
  const address = order.shippingAddress as Record<string, unknown> | null;
  const currentStatus = order.status as string;
  const isCancelled = currentStatus === "CANCELLED" || currentStatus === "REFUNDED";
  const currentStep = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div>
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Order #{order.orderNumber as string}</h1>
          <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt as string).toLocaleString()}</p>
        </div>
        <Badge variant={STATUS_COLORS[currentStatus] || "default"}>{currentStatus}</Badge>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
            <div className="absolute top-4 left-0 h-0.5 bg-black transition-all" style={{ width: `${Math.max(0, currentStep) / (STATUS_FLOW.length - 1) * 100}%` }} />
            {STATUS_FLOW.map((status, i) => {
              const Icon = TIMELINE_ICONS[status] || Clock;
              const reached = i <= currentStep;
              return (
                <div key={status} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reached ? "bg-black text-white" : "bg-gray-200 text-gray-400"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] mt-2 ${reached ? "text-black font-medium" : "text-gray-400"}`}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Status Banner */}
      {payment?.status === "PENDING_VERIFICATION" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
          Your payment is being verified. You&apos;ll be notified once it&apos;s confirmed.
        </div>
      )}
      {payment?.status === "REJECTED" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-800">
          <p className="font-medium">Payment was rejected</p>
          {payment.adminNote ? <p className="mt-1">{String(payment.adminNote)}</p> : null}
        </div>
      )}

      {/* Items */}
      <section className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Items</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map((item) => {
            const variant = item.variant as Record<string, unknown>;
            const product = variant.product as Record<string, unknown>;
            const images = product.images as Array<Record<string, unknown>>;
            return (
              <div key={item.id as string} className="flex items-center gap-4 px-5 py-4">
                {images?.[0] && (
                  <img src={images[0].url as string} alt="" className="w-14 h-14 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{String(item.productName)}</p>
                  {variant.sku ? <p className="text-xs text-gray-400">SKU: {String(variant.sku)}</p> : null}
                </div>
                <p className="text-sm text-gray-500">× {item.quantity as number}</p>
                <p className="text-sm font-medium">{formatPrice(item.total as number)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Summary + Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="border border-gray-200 rounded-lg p-5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(order.subtotal as number)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{formatPrice(order.shippingCost as number)}</span></div>
            {(order.discount as number) > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-green-600">-{formatPrice(order.discount as number)}</span></div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span><span>{formatPrice(order.total as number)}</span>
            </div>
            {payment && (
              <div className="flex justify-between pt-2 border-t text-gray-500">
                <span>Payment</span>
                <span>{String(payment.method).toUpperCase()}</span>
              </div>
            )}
          </div>
        </section>

        {address ? (
          <section className="border border-gray-200 rounded-lg p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Shipping Address</h2>
            <div className="text-sm space-y-1">
              <p className="font-medium">{String(address.label)}</p>
              <p>{String(address.street)}</p>
              {address.area ? <p className="text-gray-500">{String(address.area)}</p> : null}
              <p className="text-gray-500">{String(address.district)}, {String(address.division)}</p>
              <p className="text-gray-500">{String(address.phone)}</p>
            </div>
          </section>
        ) : null}
      </div>

      {order.notes ? (
        <section className="border border-gray-200 rounded-lg p-5 mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Your Notes</h2>
          <p className="text-sm text-gray-600">{String(order.notes)}</p>
        </section>
      ) : null}
    </div>
  );
}
