"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, CreditCard, Eye, ImageIcon, Search, XCircle } from "lucide-react";
import { Badge, Button, Input, Pagination } from "@/components/ui";
import { adminApiFetch, mapAdminApiError } from "@/lib/admin-api-client";
import { formatPrice } from "@/lib/utils";

type PaymentStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
type PaymentMethod = "BKASH" | "NAGAD" | "COD";

type Payment = {
  id: string;
  method: PaymentMethod;
  transactionId: string | null;
  screenshotUrl: string | null;
  senderPhone: string | null;
  amount: number;
  status: PaymentStatus;
  adminNote: string | null;
  paidAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      createdAt: string;
    };
    _count: { items: number };
  };
};

type PaymentsResponse = {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const statusOptions: Array<{ value: string; label: string }> = [
  { value: "", label: "All active payments" },
  { value: "PENDING_VERIFICATION", label: "Pending verification" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const methodOptions: Array<{ value: string; label: string }> = [
  { value: "", label: "bKash + Nagad" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "COD", label: "COD" },
];

const paymentBadgeVariant = (status: PaymentStatus): "success" | "warning" | "danger" => {
  if (status === "VERIFIED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
};

const getCustomerLabel = (payment: Payment): string => {
  return payment.order.user.name || payment.order.user.email || payment.order.user.phone || "Customer";
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [status, setStatus] = useState<string>("PENDING_VERIFICATION");
  const [method, setMethod] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [submittedSearch, setSubmittedSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (): Promise<void> => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);
    if (method) params.set("method", method);
    if (submittedSearch) params.set("search", submittedSearch);

    try {
      const data = await adminApiFetch<PaymentsResponse>(`/api/admin/payments?${params.toString()}`);
      setPayments(data.payments);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      setError(null);
    } catch (err) {
      setError(mapAdminApiError(err));
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [method, page, status, submittedSearch]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const submitSearch = (): void => {
    setSubmittedSearch(search.trim());
    setPage(1);
  };

  const runPaymentAction = async (paymentId: string, action: "verify" | "reject"): Promise<void> => {
    if (action === "reject") {
      const confirmed = window.confirm("Reject this payment and cancel the order?");
      if (!confirmed) return;
    }

    setProcessingId(paymentId);
    try {
      await adminApiFetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchPayments();
    } catch (err) {
      setError(mapAdminApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">{total} payment{total !== 1 ? "s" : ""} found</p>
        </div>
        <Link href="/admin/settings">
          <Button variant="outline" className="w-full sm:w-auto">Payment Accounts</Button>
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem_auto]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submitSearch();
          }}
          placeholder="Search order, transaction, customer, phone"
          aria-label="Search payments"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={method}
          onChange={(event) => {
            setMethod(event.target.value);
            setPage(1);
          }}
          className="border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
        >
          {methodOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Button onClick={submitSearch} className="gap-2">
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>

      {error ? <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div> : null}

      <div className="grid gap-3 lg:hidden">
        {loading ? (
          <div className="border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">Loading payments...</div>
        ) : payments.length === 0 ? (
          <EmptyPayments />
        ) : (
          payments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              processing={processingId === payment.id}
              onAction={runPaymentAction}
            />
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-4 text-left">Payment</th>
                <th className="px-6 py-4 text-left">Customer</th>
                <th className="px-6 py-4 text-left">Transaction</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Proof</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Loading payments...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7}><EmptyPayments /></td></tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/admin/payments/${payment.id}`} className="font-mono text-sm font-medium hover:underline">
                        {payment.order.orderNumber}
                      </Link>
                      <div className="mt-1 text-xs text-gray-400">{payment.method} · {new Date(payment.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{getCustomerLabel(payment)}</div>
                      <div className="text-xs text-gray-400">{payment.order.user.phone || payment.order.user.email || "No contact"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm">{payment.transactionId || "-"}</div>
                      <div className="text-xs text-gray-400">{payment.senderPhone || "No sender phone"}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">{formatPrice(payment.amount)}</td>
                    <td className="px-6 py-4 text-center">
                      {payment.screenshotUrl ? (
                        <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center text-gray-400 hover:text-black">
                          <ImageIcon className="h-5 w-5" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={paymentBadgeVariant(payment.status)}>{payment.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <PaymentActions payment={payment} processing={processingId === payment.id} onAction={runPaymentAction} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 ? <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /> : null}
    </div>
  );
}

function EmptyPayments() {
  return (
    <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
      <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-50" />
      No payments found
    </div>
  );
}

function PaymentCard({
  payment,
  processing,
  onAction,
}: {
  payment: Payment;
  processing: boolean;
  onAction: (paymentId: string, action: "verify" | "reject") => Promise<void>;
}) {
  return (
    <article className="border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/payments/${payment.id}`} className="font-mono text-sm font-bold hover:underline">
            {payment.order.orderNumber}
          </Link>
          <p className="mt-1 truncate text-sm text-gray-500">{getCustomerLabel(payment)}</p>
        </div>
        <Badge variant={paymentBadgeVariant(payment.status)}>{payment.status.replace("_", " ")}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="block text-xs font-bold uppercase text-gray-400">Method</span>
          {payment.method}
        </div>
        <div>
          <span className="block text-xs font-bold uppercase text-gray-400">Amount</span>
          {formatPrice(payment.amount)}
        </div>
        <div>
          <span className="block text-xs font-bold uppercase text-gray-400">Transaction</span>
          <span className="font-mono">{payment.transactionId || "-"}</span>
        </div>
        <div>
          <span className="block text-xs font-bold uppercase text-gray-400">Sender</span>
          {payment.senderPhone || "-"}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href={`/admin/payments/${payment.id}`} className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Eye className="h-4 w-4" /> View
          </Button>
        </Link>
        <PaymentActions payment={payment} processing={processing} onAction={onAction} />
      </div>
    </article>
  );
}

function PaymentActions({
  payment,
  processing,
  onAction,
}: {
  payment: Payment;
  processing: boolean;
  onAction: (paymentId: string, action: "verify" | "reject") => Promise<void>;
}) {
  if (payment.status !== "PENDING_VERIFICATION") {
    return (
      <div className="flex justify-end">
        <Link href={`/admin/payments/${payment.id}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" /> Details
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-end gap-2">
      <Button size="sm" loading={processing} onClick={() => onAction(payment.id, "verify")} className="flex-1 gap-2 lg:flex-none">
        <CheckCircle className="h-4 w-4" /> Verify
      </Button>
      <Button variant="outline" size="sm" loading={processing} onClick={() => onAction(payment.id, "reject")} className="flex-1 gap-2 text-red-500 lg:flex-none">
        <XCircle className="h-4 w-4" /> Reject
      </Button>
    </div>
  );
}
