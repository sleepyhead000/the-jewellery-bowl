import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { notifyOrderStatusChanged } from "@/lib/discord";
import { sendAdminPushNotification } from "@/lib/push";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { validateOriginForMutations } from "@/lib/api-security";
import { applyPaymentAction, PaymentActionError } from "@/lib/payment-actions";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/orders/[id]
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = hasPermission(session.user.role, "orders.view");

  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      shippingAddress: true,
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
              },
            },
          },
        },
      },
      payment: {
        include: { verifier: { select: { name: true } } },
      },
      coupon: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Customers can only see their own orders
  if (!isAdmin && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

// PATCH /api/orders/[id] — admin: update status, verify/reject payment
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "orders.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const originErr = validateOriginForMutations(req, crypto.randomUUID());
  if (originErr) return originErr;
  const limiter = await rateLimit(`orders:update:${session.user.id}`, 40, 300);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: rateLimitHeaders(limiter) }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const { status, paymentAction, adminNote } = body as {
    status?: string;
    paymentAction?: "verify" | "reject";
    adminNote?: string;
  };

  const order = await db.order.findUnique({
    where: { id },
    include: { payment: true, items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Handle payment verification
  if (paymentAction && order.payment) {
    try {
      const result = await applyPaymentAction({
        orderId: id,
        action: paymentAction,
        adminNote: adminNote?.trim() ? adminNote.trim() : null,
        actor: { id: session.user.id, name: session.user.name },
      });
      return NextResponse.json({ success: true, status: result.orderStatus });
    } catch (error) {
      if (error instanceof PaymentActionError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }
  }

  // Handle status update
  if (status) {
    await db.order.update({
      where: { id },
      data: { status: status as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" },
    });
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ORDER_STATUS_UPDATED",
        entity: "ORDER",
        entityId: id,
        details: { status },
      },
    });

    notifyOrderStatusChanged({
      orderNumber: order.orderNumber,
      status,
      adminName: session.user.name || "Admin",
    }).catch(console.error);
    sendAdminPushNotification({
      title: `Order status updated: ${order.orderNumber}`,
      message: `Status changed to ${status}.`,
      type: "ORDER_STATUS_UPDATED",
      priority: "MEDIUM",
      entity: "order",
      entityId: id,
    }).catch(console.error);

    return NextResponse.json({ success: true, status });
  }

  return NextResponse.json({ error: "No action specified" }, { status: 400 });
}
