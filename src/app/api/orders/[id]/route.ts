import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { notifyOrderStatusChanged } from "@/lib/discord";
import { sendAdminPushNotification } from "@/lib/push";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

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
    if (paymentAction === "verify") {
      await db.payment.update({
        where: { id: order.payment.id },
        data: {
          status: "VERIFIED",
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
          adminNote,
        },
      });

      await db.order.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PAYMENT_VERIFIED",
          entity: "ORDER",
          entityId: id,
          details: { paymentId: order.payment.id, adminNote: adminNote || null },
        },
      });

      notifyOrderStatusChanged({
        orderNumber: order.orderNumber,
        status: "CONFIRMED",
        adminName: session.user.name || "Admin",
      }).catch(console.error);
      sendAdminPushNotification({
        title: `Payment verified: ${order.orderNumber}`,
        message: `Order moved to CONFIRMED by ${session.user.name || "Admin"}.`,
        type: "PAYMENT_VERIFIED",
        priority: "HIGH",
        entity: "order",
        entityId: id,
      }).catch(console.error);

      return NextResponse.json({ success: true, status: "CONFIRMED" });
    }

    if (paymentAction === "reject") {
      await db.payment.update({
        where: { id: order.payment.id },
        data: {
          status: "REJECTED",
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
          adminNote,
        },
      });

      // Restore stock
      for (const item of order.items) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await db.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PAYMENT_REJECTED",
          entity: "ORDER",
          entityId: id,
          details: { paymentId: order.payment.id, adminNote: adminNote || null },
        },
      });

      notifyOrderStatusChanged({
        orderNumber: order.orderNumber,
        status: "CANCELLED",
        adminName: session.user.name || "Admin",
      }).catch(console.error);
      sendAdminPushNotification({
        title: `Payment rejected: ${order.orderNumber}`,
        message: `Order cancelled and stock restored by ${session.user.name || "Admin"}.`,
        type: "PAYMENT_REJECTED",
        priority: "HIGH",
        entity: "order",
        entityId: id,
      }).catch(console.error);

      return NextResponse.json({ success: true, status: "CANCELLED" });
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
