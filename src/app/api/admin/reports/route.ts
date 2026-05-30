import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";

const reportRanges = ["7d", "30d", "90d", "all"] as const;
const excludedRevenueStatuses = ["CANCELLED", "REFUNDED"] as const;

type ReportRange = (typeof reportRanges)[number];

type DateWindow = {
  from: Date | null;
  to: Date | null;
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

type ReportResponse = {
  window: {
    from: string | null;
    to: string | null;
    label: string;
    range: DateWindow["range"];
  };
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

const isReportRange = (value: string): value is ReportRange => {
  return reportRanges.includes(value as ReportRange);
};

const startOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseDateParam = (value: string): Date | null => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateKey = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const resolveDateWindow = (req: NextRequest): DateWindow | { error: string } => {
  const fromRaw = req.nextUrl.searchParams.get("from");
  const toRaw = req.nextUrl.searchParams.get("to");
  const rangeRaw = req.nextUrl.searchParams.get("range") ?? "30d";

  if (fromRaw || toRaw) {
    if (!fromRaw || !toRaw) {
      return { error: "Both from and to dates are required for a custom report range." };
    }
    const from = parseDateParam(fromRaw);
    const to = parseDateParam(toRaw);
    if (!from || !to) {
      return { error: "Report dates must be valid ISO date values." };
    }
    if (from > to) {
      return { error: "Report from date must be before or equal to the to date." };
    }
    return {
      from: startOfDay(from),
      to: endOfDay(to),
      label: `${formatDateKey(from)} to ${formatDateKey(to)}`,
      range: "custom",
    };
  }

  if (!isReportRange(rangeRaw)) {
    return { error: "Report range must be one of 7d, 30d, 90d, or all." };
  }

  if (rangeRaw === "all") {
    return { from: null, to: null, label: "All time", range: "all" };
  }

  const days = rangeRaw === "7d" ? 7 : rangeRaw === "30d" ? 30 : 90;
  const today = new Date();
  const from = startOfDay(addDays(today, -(days - 1)));
  const to = endOfDay(today);
  return { from, to, label: `Last ${days} days`, range: rangeRaw };
};

const buildCreatedAtWhere = (window: DateWindow): Prisma.DateTimeFilter | undefined => {
  if (!window.from && !window.to) return undefined;
  return {
    ...(window.from ? { gte: window.from } : {}),
    ...(window.to ? { lte: window.to } : {}),
  };
};

const buildOrderWhere = (window: DateWindow): Prisma.OrderWhereInput => {
  const createdAt = buildCreatedAtWhere(window);
  return createdAt ? { createdAt } : {};
};

const buildPaymentWhere = (window: DateWindow): Prisma.PaymentWhereInput => {
  const createdAt = buildCreatedAtWhere(window);
  return createdAt ? { createdAt } : {};
};

const isRevenueOrder = (status: string): boolean => {
  return !excludedRevenueStatuses.includes(status as (typeof excludedRevenueStatuses)[number]);
};

const buildDailySeries = (
  orders: Array<{ createdAt: Date; total: number; status: string }>,
  window: DateWindow
): DailyReportPoint[] => {
  const revenueOrders = orders.filter((order) => isRevenueOrder(order.status));
  if (revenueOrders.length === 0 && !window.from && !window.to) return [];

  const firstOrderDate = revenueOrders.reduce<Date | null>((earliest, order) => {
    if (!earliest || order.createdAt < earliest) return order.createdAt;
    return earliest;
  }, null);

  const from = startOfDay(window.from ?? firstOrderDate ?? new Date());
  const to = startOfDay(window.to ?? new Date());
  const points = new Map<string, DailyReportPoint>();

  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    const key = formatDateKey(cursor);
    points.set(key, { date: key, revenue: 0, orders: 0 });
  }

  for (const order of revenueOrders) {
    const key = formatDateKey(order.createdAt);
    const point = points.get(key);
    if (point) {
      point.revenue += order.total;
      point.orders += 1;
    }
  }

  return Array.from(points.values());
};

const summarizeSales = (
  orders: Array<{ subtotal: number; shippingCost: number; discount: number; total: number; status: string; payment: { status: string } | null }>
): MoneyMetrics => {
  const revenueOrders = orders.filter((order) => isRevenueOrder(order.status));
  const grossRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const netRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
  const verifiedRevenue = revenueOrders
    .filter((order) => order.payment?.status === "VERIFIED")
    .reduce((sum, order) => sum + order.total, 0);
  const subtotal = revenueOrders.reduce((sum, order) => sum + order.subtotal, 0);
  const shipping = revenueOrders.reduce((sum, order) => sum + order.shippingCost, 0);
  const discounts = revenueOrders.reduce((sum, order) => sum + order.discount, 0);
  const averageOrderValue = revenueOrders.length > 0 ? Math.round(netRevenue / revenueOrders.length) : 0;

  return { grossRevenue, netRevenue, verifiedRevenue, subtotal, shipping, discounts, averageOrderValue };
};

const summarizeOrders = (
  orders: Array<{ status: string; payment: { status: string } | null }>
): OrderMetrics => {
  return {
    totalOrders: orders.length,
    paidOrders: orders.filter((order) => order.payment?.status === "VERIFIED").length,
    pendingOrders: orders.filter((order) => order.status === "PENDING").length,
    cancelledOrRefundedOrders: orders.filter((order) => excludedRevenueStatuses.includes(order.status as (typeof excludedRevenueStatuses)[number])).length,
  };
};

const summarizePayments = (
  payments: Array<{ status: string; method: string }>
): PaymentMetrics => {
  return {
    verified: payments.filter((payment) => payment.status === "VERIFIED").length,
    pendingVerification: payments.filter((payment) => payment.status === "PENDING_VERIFICATION").length,
    rejected: payments.filter((payment) => payment.status === "REJECTED").length,
    cod: payments.filter((payment) => payment.method === "COD").length,
    nonCod: payments.filter((payment) => payment.method !== "COD").length,
  };
};

const summarizeTopProducts = (
  items: Array<{ productName: string; quantity: number; total: number }>
): TopProduct[] => {
  const byProduct = new Map<string, TopProduct>();

  for (const item of items) {
    const existing = byProduct.get(item.productName) ?? { productName: item.productName, quantity: 0, revenue: 0 };
    byProduct.set(item.productName, {
      productName: item.productName,
      quantity: existing.quantity + item.quantity,
      revenue: existing.revenue + item.total,
    });
  }

  return Array.from(byProduct.values())
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 10);
};

export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "reports.view",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:reports:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const windowResult = resolveDateWindow(req);
  if ("error" in windowResult) {
    return validationError(context.requestId, windowResult.error);
  }

  const orderWhere = buildOrderWhere(windowResult);
  const validOrderWhere: Prisma.OrderWhereInput = {
    ...orderWhere,
    status: { notIn: [...excludedRevenueStatuses] },
  };
  const paymentWhere = buildPaymentWhere(windowResult);
  const customerCreatedAt = buildCreatedAtWhere(windowResult);

  const [
    orders,
    payments,
    newCustomers,
    totalCustomers,
    activeProducts,
    totalVariants,
    lowStockVariants,
    outOfStockVariants,
    lowStockProducts,
    topProductItems,
    recentHighValueOrders,
  ] = await Promise.all([
    db.order.findMany({
      where: orderWhere,
      select: {
        subtotal: true,
        shippingCost: true,
        discount: true,
        total: true,
        status: true,
        createdAt: true,
        payment: { select: { status: true } },
      },
    }),
    db.payment.findMany({
      where: paymentWhere,
      select: { status: true, method: true, amount: true },
    }),
    db.user.count({
      where: {
        role: "CUSTOMER",
        ...(customerCreatedAt ? { createdAt: customerCreatedAt } : {}),
      },
    }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.productVariant.count(),
    db.productVariant.count({ where: { stock: { lte: 5 } } }),
    db.productVariant.count({ where: { stock: { lte: 0 } } }),
    db.productVariant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: [{ stock: "asc" }, { sku: "asc" }],
      take: 10,
    }),
    db.orderItem.findMany({
      where: { order: validOrderWhere },
      select: { productName: true, quantity: true, total: true },
    }),
    db.order.findMany({
      where: validOrderWhere,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, phone: true } },
        payment: { select: { status: true } },
      },
      orderBy: [{ total: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
  ]);

  const response: ReportResponse = {
    window: {
      from: windowResult.from?.toISOString() ?? null,
      to: windowResult.to?.toISOString() ?? null,
      label: windowResult.label,
      range: windowResult.range,
    },
    sales: summarizeSales(orders),
    orders: summarizeOrders(orders),
    payments: summarizePayments(payments),
    customers: { newCustomers, totalCustomers },
    inventory: { activeProducts, totalVariants, lowStockVariants, outOfStockVariants },
    topProducts: summarizeTopProducts(topProductItems),
    recentHighValueOrders: recentHighValueOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      customerName: order.user.name,
      customerPhone: order.user.phone,
      paymentStatus: order.payment?.status ?? null,
    })),
    lowStockProducts: lowStockProducts.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      stock: variant.stock,
      productName: variant.product.name,
      productSlug: variant.product.slug,
    })),
    daily: buildDailySeries(orders, windowResult),
  };

  return withRequestId(context.requestId, response);
}
