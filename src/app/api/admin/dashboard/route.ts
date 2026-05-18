import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";

// GET /api/admin/dashboard
export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "orders.view",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:dashboard:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todayOrders,
    pendingOrders,
    totalCustomers,
    totalProducts,
    pendingPayments,
    lowStockVariants,
    recentOrders,
    todayRevenue,
  ] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: today } } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.payment.count({ where: { status: "PENDING_VERIFICATION" } }),
    db.productVariant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, phone: true } },
        payment: { select: { status: true, method: true } },
      },
    }),
    db.order.aggregate({
      where: {
        createdAt: { gte: today },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      _sum: { total: true },
    }),
  ]);

  return withRequestId(context.requestId, {
    stats: {
      todayRevenue: todayRevenue._sum.total || 0,
      todayOrders,
      pendingOrders,
      pendingPayments,
      totalCustomers,
      totalProducts,
    },
    lowStockVariants,
    recentOrders,
  });
}
