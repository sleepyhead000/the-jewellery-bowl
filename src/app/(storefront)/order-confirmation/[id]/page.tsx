"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui";

interface Props {
  params: Promise<{ id: string }>;
}

export default function OrderConfirmationPage({ params }: Props) {
  const { id } = use(params);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-sm">Loading order details...</p>
      </div>
    );
  }

  if (!order || order.error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Order not found</p>
        <Link href="/products"><Button className="mt-4">Continue Shopping</Button></Link>
      </div>
    );
  }

  const payment = order.payment as Record<string, unknown> | null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <CheckCircle className="h-16 w-16 mx-auto mb-6 text-green-500" />
      <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">Order Placed!</h1>
      <p className="text-gray-500 mb-1">Order #{order.orderNumber as string}</p>

      {payment && (payment.method as string) !== "COD" && (
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg mt-4 mb-6">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-700">
            Your payment is being verified. You&apos;ll be notified once confirmed.
          </span>
        </div>
      )}

      {payment && (payment.method as string) === "COD" && (
        <p className="text-sm text-gray-500 mt-4 mb-6">
          Please have {formatPrice(order.total as number)} ready for the delivery person.
        </p>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left mt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span>{formatPrice(order.subtotal as number)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Shipping</span>
          <span>{formatPrice(order.shippingCost as number)}</span>
        </div>
        {(order.discount as number) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Discount</span>
            <span className="text-green-600">-{formatPrice(order.discount as number)}</span>
          </div>
        )}
        <div className="border-t pt-3 flex justify-between font-bold text-sm">
          <span>Total</span>
          <span>{formatPrice(order.total as number)}</span>
        </div>
      </div>

      <div className="flex gap-3 justify-center mt-8">
        <Link href="/account/orders"><Button variant="outline">View Orders</Button></Link>
        <Link href="/products"><Button>Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
