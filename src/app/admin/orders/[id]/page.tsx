"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Truck } from "lucide-react";
import { Button, Badge, Input } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "danger"> = {
  PENDING: "warning", CONFIRMED: "success", PROCESSING: "default",
  SHIPPED: "default", DELIVERED: "success", CANCELLED: "danger", REFUNDED: "danger",
};

export default function AdminOrderDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setNewStatus(data.status);
        setLoading(false);
      });
  }, [id]);

  const handlePaymentAction = async (action: "verify" | "reject") => {
    if (action === "reject" && !adminNote.trim()) {
      alert("Please add a note explaining the rejection reason");
      return;
    }
    setProcessing(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentAction: action, adminNote: adminNote.trim() || undefined }),
    });
    if (res.ok) {
      const updated = await fetch(`/api/orders/${id}`).then((r) => r.json());
      setOrder(updated);
      setNewStatus(updated.status);
    }
    setProcessing(false);
  };

  const handleStatusUpdate = async () => {
    if (newStatus === order?.status) return;
    setProcessing(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await fetch(`/api/orders/${id}`).then((r) => r.json());
      setOrder(updated);
    }
    setProcessing(false);
  };

  if (loading) return <div className="text-gray-400 text-sm p-6">Loading order...</div>;
  if (!order) return <div className="text-gray-400 text-sm p-6">Order not found</div>;

  const payment = order.payment as Record<string, unknown> | null;
  const items = order.items as Array<Record<string, unknown>>;
  const address = order.shippingAddress as Record<string, unknown> | null;
  const user = order.user as Record<string, unknown>;
  const verifier = payment?.verifier as Record<string, unknown> | null;

  const addressSection: React.ReactNode = address != null ? (
    <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-2">
      <h2 className="text-sm font-bold uppercase tracking-wide">Shipping Address</h2>
      <p className="text-sm">{String(address.street)}</p>
      {address.area != null ? <p className="text-sm text-gray-500">{String(address.area)}</p> : null}
      <p className="text-sm text-gray-500">{String(address.district)}, {String(address.division)}</p>
      <p className="text-sm text-gray-500">Phone: {String(address.phone)}</p>
    </section>
  ) : null;

  const notesSection: React.ReactNode = order.notes != null ? (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-bold uppercase tracking-wide mb-2">Customer Notes</h2>
      <p className="text-sm text-gray-600">{String(order.notes)}</p>
    </section>
  ) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/admin/orders")} className="p-2 text-gray-400 hover:text-black transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Order #{String(order.orderNumber)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date(order.createdAt as string).toLocaleString()} · <Badge variant={STATUS_COLORS[order.status as string] || "default"}>{String(order.status)}</Badge>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold uppercase tracking-wide">Items ({items.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((item) => {
                const variant = item.variant as Record<string, unknown>;
                const product = variant.product as Record<string, unknown>;
                const images = product.images as Array<Record<string, unknown>>;
                return (
                  <div key={item.id as string} className="flex items-center gap-4 px-6 py-4">
                    {images?.[0] && (
                      <img src={images[0].url as string} alt="" className="w-12 h-12 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{String(item.productName)}</div>
                      <div className="text-xs text-gray-400">SKU: {String(variant.sku) || "—"}</div>
                    </div>
                    <div className="text-sm text-gray-500">× {item.quantity as number}</div>
                    <div className="text-sm font-medium text-right">{formatPrice(item.total as number)}</div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(order.subtotal as number)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{formatPrice(order.shippingCost as number)}</span></div>
              {(order.discount as number) > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-green-600">-{formatPrice(order.discount as number)}</span></div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total</span><span>{formatPrice(order.total as number)}</span>
              </div>
            </div>
          </section>

          {/* Payment Proof */}
          {payment && (
            <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide">Payment Details</h2>
                <Badge variant={payment.status === "VERIFIED" ? "success" : payment.status === "REJECTED" ? "danger" : "warning"}>
                  {String(payment.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400 block text-xs uppercase mb-0.5">Method</span>{String(payment.method).toUpperCase()}</div>
                <div><span className="text-gray-400 block text-xs uppercase mb-0.5">Amount</span>{formatPrice(payment.amount as number)}</div>
                {!!payment.transactionId && (
                  <div><span className="text-gray-400 block text-xs uppercase mb-0.5">Transaction ID</span><span className="font-mono">{String(payment.transactionId)}</span></div>
                )}
                {!!payment.senderPhone && (
                  <div><span className="text-gray-400 block text-xs uppercase mb-0.5">Sender Phone</span>{String(payment.senderPhone)}</div>
                )}
                {!!payment.paidAt && (
                  <div><span className="text-gray-400 block text-xs uppercase mb-0.5">Paid At</span>{new Date(payment.paidAt as string).toLocaleString()}</div>
                )}
                {!!payment.verifiedAt && (
                  <div><span className="text-gray-400 block text-xs uppercase mb-0.5">Verified At</span>{new Date(payment.verifiedAt as string).toLocaleString()}</div>
                )}
              </div>

              {!!payment.screenshotUrl && (
                <div>
                  <span className="text-gray-400 block text-xs uppercase mb-1">Screenshot</span>
                  <a href={payment.screenshotUrl as string} target="_blank" rel="noopener noreferrer">
                    <img src={payment.screenshotUrl as string} alt="Payment proof" className="max-w-xs rounded border cursor-pointer hover:opacity-80 transition-opacity" />
                  </a>
                </div>
              )}

              {verifier && (
                <p className="text-xs text-gray-400">Verified by: {String(verifier.name)}</p>
              )}

              {!!payment.adminNote && (
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <span className="text-gray-400 block text-xs uppercase mb-0.5">Admin Note</span>
                  {String(payment.adminNote)}
                </div>
              )}

              {/* Verify / Reject actions */}
              {payment.status === "PENDING_VERIFICATION" && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <Input
                    label="Admin Note"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Optional note (required for rejection)"
                  />
                  <div className="flex gap-3">
                    <Button onClick={() => handlePaymentAction("verify")} disabled={processing}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Verify Payment
                    </Button>
                    <Button variant="outline" onClick={() => handlePaymentAction("reject")} disabled={processing} className="text-red-500 border-red-300 hover:bg-red-50">
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wide">Customer</h2>
            <p className="text-sm font-medium">{String(user.name) || "—"}</p>
            <p className="text-sm text-gray-500">{String(user.phone)}</p>
            {user.email != null ? <p className="text-sm text-gray-500">{String(user.email)}</p> : null}
          </section>

          {/* Shipping */}
          {addressSection}

          {/* Update Status */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
              <Truck className="h-4 w-4" /> Update Status
            </h2>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button onClick={handleStatusUpdate} disabled={processing || newStatus === order.status} className="w-full">
              Update Status
            </Button>
          </section>

          {/* Order notes */}
          {notesSection}
        </div>
      </div>
    </div>
  );
}
