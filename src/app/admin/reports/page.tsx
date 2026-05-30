"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BarChart3, Boxes, CreditCard, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { Badge, Button, Input } from "@/components/ui";
import { adminApiFetch, mapAdminApiError } from "@/lib/admin-api-client";
import { formatPrice } from "@/lib/utils";

type ReportRange = "7d" | "30d" | "90d" | "all";

type ReportWindow = {
  from: string | null;
  to: string | null;
  label: string;
  range: ReportRange | "custom";
};

type MoneyMetrics = {
  grossRevenue: number;
  netRevenue: number;
  verifiedRevenue: number;
  subtotal: number;
  shipping: number;
  discounts: number;
  averageOrderValue: number;
};

type OrderMetrics = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrRefundedOrders: number;
};

type PaymentMetrics = {
  verified: number;
  pendingVerification: number;
  rejected: number;
  cod: number;
  nonCod: number;
};

type CustomerMetrics = {
  newCustomers: number;
  totalCustomers: number;
};

type InventoryMetrics = {
  activeProducts: number;
  totalVariants: number;
  lowStockVariants: number;
  outOfStockVariants: number;
};

type TopProduct = {
  productName: string;
  quantity: number;
  revenue: number;
};

type RecentHighValueOrder = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  paymentStatus: string | null;
};

type LowStockProduct = {
  id: string;
  sku: string;
  stock: number;
  productName: string;
  productSlug: string;
};

type DailyReportPoint = {
  date: string;
  revenue: number;
  orders: number;
};

type ReportData = {
  window: ReportWindow;
  sales: MoneyMetrics;
  orders: OrderMetrics;
  payments: PaymentMetrics;
  customers: CustomerMetrics;
  inventory: InventoryMetrics;
  topProducts: TopProduct[];
  recentHighValueOrders: RecentHighValueOrder[];
  lowStockProducts: LowStockProduct[];
  daily: DailyReportPoint[];
};

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "success" | "warning" | "danger";
};

const rangeOptions: Array<{ value: ReportRange; label: string }> = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "all", label: "All" },
];

const orderStatusVariant = (status: string): "default" | "success" | "warning" | "danger" => {
  if (status === "DELIVERED" || status === "CONFIRMED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "CANCELLED" || status === "REFUNDED") return "danger";
  return "default";
};

const paymentStatusVariant = (status: string | null): "default" | "success" | "warning" | "danger" => {
  if (status === "VERIFIED") return "success";
  if (status === "PENDING_VERIFICATION") return "warning";
  if (status === "REJECTED") return "danger";
  return "default";
};

const formatDate = (value: string): string => {
  return new Date(value).toLocaleDateString("en-BD", { month: "short", day: "numeric", year: "numeric" });
};

const buildReportsUrl = (range: ReportRange, from: string, to: string): string => {
  const params = new URLSearchParams();
  if (from.trim().length > 0 && to.trim().length > 0) {
    params.set("from", from);
    params.set("to", to);
  } else {
    params.set("range", range);
  }
  return `/api/admin/reports?${params.toString()}`;
};

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [range, setRange] = useState<ReportRange>("30d");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await adminApiFetch<ReportData>(buildReportsUrl(range, from, to));
      setData(result);
      setError(null);
    } catch (err) {
      setError(mapAdminApiError(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, range, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchReports();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchReports]);

  const maxDailyRevenue = useMemo(() => {
    if (!data || data.daily.length === 0) return 0;
    return Math.max(...data.daily.map((point) => point.revenue));
  }, [data]);

  const selectRange = (nextRange: ReportRange): void => {
    setRange(nextRange);
    setFrom("");
    setTo("");
  };

  const applyCustomRange = (): void => {
    void fetchReports();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Store performance, payments, inventory, and product movement.
          </p>
          {data ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">Showing {data.window.label}</p> : null}
        </div>

        <div className="grid gap-3 md:grid-cols-[auto_1fr_1fr_auto] xl:min-w-[44rem]">
          <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] p-1">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => selectRange(option.value)}
                className={`min-h-9 px-3 text-xs font-bold uppercase transition-colors ${
                  range === option.value && from.length === 0 && to.length === 0
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Report start date" />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Report end date" />
          <Button type="button" onClick={applyCustomRange}>Apply</Button>
        </div>
      </div>

      {error ? <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div> : null}
      {loading ? <div className="border border-[var(--color-border)] bg-[var(--color-elevated)] p-8 text-center text-sm text-[var(--color-text-muted)]">Loading reports...</div> : null}

      {data ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={TrendingUp} label="Net Revenue" value={formatPrice(data.sales.netRevenue)} helper="Excludes cancelled/refunded orders" tone="success" />
            <StatCard icon={CreditCard} label="Verified Revenue" value={formatPrice(data.sales.verifiedRevenue)} helper={`${data.orders.paidOrders} verified paid orders`} tone="default" />
            <StatCard icon={ShoppingCart} label="Total Orders" value={String(data.orders.totalOrders)} helper={`${data.orders.pendingOrders} pending orders`} tone={data.orders.pendingOrders > 0 ? "warning" : "default"} />
            <StatCard icon={Users} label="New Customers" value={String(data.customers.newCustomers)} helper={`${data.customers.totalCustomers} total customers`} tone="default" />
            <StatCard icon={Package} label="Average Order" value={formatPrice(data.sales.averageOrderValue)} helper="Based on revenue orders" tone="default" />
            <StatCard icon={CreditCard} label="Pending Payments" value={String(data.payments.pendingVerification)} helper={`${data.payments.verified} verified, ${data.payments.rejected} rejected`} tone={data.payments.pendingVerification > 0 ? "warning" : "default"} />
            <StatCard icon={Boxes} label="Active Products" value={String(data.inventory.activeProducts)} helper={`${data.inventory.totalVariants} total variants`} tone="default" />
            <StatCard icon={AlertTriangle} label="Low Stock" value={String(data.inventory.lowStockVariants)} helper={`${data.inventory.outOfStockVariants} out of stock`} tone={data.inventory.lowStockVariants > 0 ? "danger" : "success"} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Panel title="Daily Revenue" empty={data.daily.length === 0}>
              <div className="space-y-3">
                {data.daily.map((point) => (
                  <div key={point.date} className="grid grid-cols-[5rem_1fr_7rem] items-center gap-3 text-sm">
                    <span className="text-xs text-[var(--color-text-muted)]">{point.date.slice(5)}</span>
                    <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)]"
                        style={{ width: `${maxDailyRevenue > 0 ? Math.max(4, Math.round((point.revenue / maxDailyRevenue) * 100)) : 0}%` }}
                      />
                    </div>
                    <span className="text-right font-medium">{formatPrice(point.revenue)}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Sales Breakdown" empty={false}>
              <MetricRow label="Gross revenue" value={formatPrice(data.sales.grossRevenue)} />
              <MetricRow label="Subtotal" value={formatPrice(data.sales.subtotal)} />
              <MetricRow label="Shipping" value={formatPrice(data.sales.shipping)} />
              <MetricRow label="Discounts" value={formatPrice(data.sales.discounts)} />
              <MetricRow label="COD payments" value={String(data.payments.cod)} />
              <MetricRow label="Non-COD payments" value={String(data.payments.nonCod)} />
            </Panel>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <Panel title="Top Products" empty={data.topProducts.length === 0}>
              <div className="space-y-3">
                {data.topProducts.map((product) => (
                  <div key={product.productName} className="flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.productName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{product.quantity} sold</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold">{formatPrice(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="High-Value Orders" empty={data.recentHighValueOrders.length === 0}>
              <div className="space-y-3">
                {data.recentHighValueOrders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className="block border-b border-[var(--color-border-subtle)] pb-3 last:border-0 last:pb-0 hover:opacity-80">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                      <span className="text-sm font-bold">{formatPrice(order.total)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={orderStatusVariant(order.status)}>{order.status}</Badge>
                      <Badge variant={paymentStatusVariant(order.paymentStatus)}>{order.paymentStatus?.replace("_", " ") ?? "No payment"}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      {order.customerName || order.customerPhone || "Customer"} · {formatDate(order.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel title="Low Stock" empty={data.lowStockProducts.length === 0}>
              <div className="space-y-3">
                {data.lowStockProducts.map((variant) => (
                  <Link key={variant.id} href={`/products/${variant.productSlug}`} className="flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3 last:border-0 last:pb-0 hover:opacity-80">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{variant.productName}</p>
                      <p className="font-mono text-xs text-[var(--color-text-muted)]">{variant.sku}</p>
                    </div>
                    <Badge variant={variant.stock <= 0 ? "danger" : "warning"}>{variant.stock <= 0 ? "Out" : `${variant.stock} left`}</Badge>
                  </Link>
                ))}
              </div>
            </Panel>
          </section>
        </>
      ) : null}
    </div>
  );
}

function StatCard(props: StatCardProps) {
  const { icon: Icon, label, value, helper, tone } = props;
  const toneClassName = {
    default: "border-[var(--color-border)]",
    success: "border-[var(--color-success)]",
    warning: "border-[var(--color-warning)]",
    danger: "border-[var(--color-danger)]",
  }[tone];

  return (
    <div className={`border bg-[var(--color-elevated)] p-5 ${toneClassName}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</span>
        <Icon className="h-5 w-5 text-[var(--color-text-muted)]" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
    </div>
  );
}

function Panel(props: { title: string; empty: boolean; children: React.ReactNode }) {
  const { title, empty, children } = props;
  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-elevated)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[var(--color-accent)]" />
        <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
      </div>
      {empty ? <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No report data for this range.</p> : children}
    </div>
  );
}

function MetricRow(props: { label: string; value: string }) {
  const { label, value } = props;
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] py-3 text-sm last:border-0">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
