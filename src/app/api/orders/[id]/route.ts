import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { notifyOrderStatusChanged } from "@/lib/discord";

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

      notifyOrderStatusChanged({
        orderNumber: order.orderNumber,
        status: "CONFIRMED",
        adminName: session.user.name || "Admin",
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

      notifyOrderStatusChanged({
        orderNumber: order.orderNumber,
        status: "CANCELLED",
        adminName: session.user.name || "Admin",
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

    notifyOrderStatusChanged({
      orderNumber: order.orderNumber,
      status,
      adminName: session.user.name || "Admin",
    }).catch(console.error);

    return NextResponse.json({ success: true, status });
  }

  return NextResponse.json({ error: "No action specified" }, { status: 400 });
}
