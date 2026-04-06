import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

// GET /api/admin/dashboard
export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "orders.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  return NextResponse.json({
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
