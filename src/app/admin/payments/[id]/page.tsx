"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, ExternalLink, Package, XCircle } from "lucide-react";
import { Badge, Button, Input } from "@/components/ui";
import { adminApiFetch, mapAdminApiError } from "@/lib/admin-api-client";
import { formatPrice } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

type PaymentStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

type PaymentDetail = {
  id: string;
  method: string;
  transactionId: string | null;
  screenshotUrl: string | null;
  senderPhone: string | null;
  amount: number;
  status: PaymentStatus;
  adminNote: string | null;
  paidAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  verifier: { id: string; name: string | null; email: string | null } | null;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    subtotal: number;
    shippingCost: number;
    discount: number;
    total: number;
    notes: string | null;
    createdAt: string;
    user: { id: string; name: string | null; email: string | null; phone: string | null; createdAt: string };
    shippingAddress: Record<string, unknown> | null;
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
      total: number;
      variant: {
        sku: string;
        product: { images: Array<{ url: string; alt: string | null }> };
      };
    }>;
  };
};

const statusVariant = (status: PaymentStatus): "success" | "warning" | "danger" => {
  if (status === "VERIFIED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
};

export default function AdminPaymentDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [adminNote, setAdminNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayment = async (): Promise<void> => {
    try {
      const data = await adminApiFetch<PaymentDetail>(`/api/admin/payments/${id}`);
      setPayment(data);
      setAdminNote(data.adminNote || "");
      setError(null);
    } catch (err) {
      setError(mapAdminApiError(err));
      setPayment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const runPaymentAction = async (action: "verify" | "reject"): Promise<void> => {
    if (action === "reject" && !adminNote.trim()) {
      setError("Add an admin note before rejecting a payment.");
      return;
    }

    setProcessing(true);
    try {
      await adminApiFetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote: adminNote.trim() || null }),
      });
      await fetchPayment();
    } catch (err) {
      setError(mapAdminApiError(err));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading payment...</div>;
  if (!payment) return <div className="p-6 text-sm text-red-500">{error || "Payment not found"}</div>;

  const customer = payment.order.user;
  const address = payment.order.shippingAddress;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push("/admin/payments")} className="p-2 text-gray-400 transition-colors hover:text-black" aria-label="Back to payments">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">Payment {payment.order.orderNumber}</h1>
            <p className="mt-1 text-sm text-gray-500">{new Date(payment.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <Badge variant={statusVariant(payment.status)}>{payment.status.replace("_", " ")}</Badge>
      </div>

      {error ? <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="border border-gray-200 bg-white p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wide">Payment Proof</h2>
              {payment.screenshotUrl ? (
                <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold uppercase text-gray-500 hover:text-black">
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
            {payment.screenshotUrl ? (
              <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer">
                <img src={payment.screenshotUrl} alt="Payment proof screenshot" className="max-h-[70vh] w-full border border-gray-100 object-contain" />
              </a>
            ) : (
              <div className="flex min-h-72 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                No screenshot was uploaded for this payment.
              </div>
            )}
          </section>

          <section className="border border-gray-200 bg-white p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide">Order Summary</h2>
              <Link href={`/admin/orders/${payment.order.id}`} className="text-xs font-bold uppercase text-gray-400 hover:text-black">
                View Order
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {payment.order.items.map((item) => {
                const image = item.variant.product.images[0];
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    {image ? (
                      <img src={image.url} alt={image.alt || item.productName} className="h-12 w-12 object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center bg-gray-50">
                        <Package className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.productName}</div>
                      <div className="text-xs text-gray-400">SKU: {item.variant.sku || "-"} · Qty {item.quantity}</div>
                    </div>
                    <div className="text-sm font-medium">{formatPrice(item.total)}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(payment.order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{formatPrice(payment.order.shippingCost)}</span></div>
              {payment.order.discount > 0 ? <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(payment.order.discount)}</span></div> : null}
              <div className="flex justify-between border-t border-gray-100 pt-2 font-bold"><span>Total</span><span>{formatPrice(payment.order.total)}</span></div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-gray-200 bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">Payment Details</h2>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <DetailItem label="Method" value={payment.method} />
              <DetailItem label="Amount" value={formatPrice(payment.amount)} />
              <DetailItem label="Transaction ID" value={payment.transactionId || "-"} mono={true} />
              <DetailItem label="Sender Phone" value={payment.senderPhone || "-"} />
              <DetailItem label="Paid At" value={payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "-"} />
              <DetailItem label="Verified At" value={payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleString() : "-"} />
              <DetailItem label="Verified By" value={payment.verifier?.name || payment.verifier?.email || "-"} />
            </dl>
          </section>

          <section className="border border-gray-200 bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">Customer Account</h2>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <DetailItem label="Name" value={customer.name || "-"} />
              <DetailItem label="Email" value={customer.email || "-"} />
              <DetailItem label="Phone" value={customer.phone || "-"} />
              <DetailItem label="Joined" value={new Date(customer.createdAt).toLocaleDateString()} />
            </dl>
          </section>

          {address ? (
            <section className="border border-gray-200 bg-white p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">Shipping Address</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="text-gray-900">{String(address.street)}</p>
                {address.area ? <p>{String(address.area)}</p> : null}
                <p>{String(address.district)}, {String(address.division)}</p>
                <p>Phone: {String(address.phone)}</p>
              </div>
            </section>
          ) : null}

          <section className="border border-gray-200 bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">Verification</h2>
            {payment.status === "PENDING_VERIFICATION" ? (
              <div className="space-y-3">
                <Input
                  label="Admin Note"
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  placeholder="Required for rejection"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <Button onClick={() => runPaymentAction("verify")} loading={processing} className="gap-2">
                    <CheckCircle className="h-4 w-4" /> Verify Payment
                  </Button>
                  <Button variant="outline" onClick={() => runPaymentAction("reject")} loading={processing} className="gap-2 text-red-500">
                    <XCircle className="h-4 w-4" /> Reject Payment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-gray-500">This payment is already {payment.status.toLowerCase().replace("_", " ")}.</p>
                {payment.adminNote ? (
                  <div className="bg-gray-50 p-3">
                    <span className="mb-1 block text-xs font-bold uppercase text-gray-400">Admin Note</span>
                    {payment.adminNote}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="mb-0.5 text-xs font-bold uppercase text-gray-400">{label}</dt>
      <dd className={mono ? "break-all font-mono text-gray-900" : "break-words text-gray-900"}>{value}</dd>
    </div>
  );
}
