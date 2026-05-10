import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { notifyPaymentSubmitted } from "@/lib/discord";
import { sendAdminPushNotification } from "@/lib/push";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const checkoutSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["BKASH", "NAGAD", "COD"]),
  transactionId: z.string().optional(),
  senderPhone: z.string().optional(),
  screenshotUrl: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/orders — customer sees own orders, admin sees all
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams;
  const page = parseInt(url.get("page") || "1");
  const limit = parseInt(url.get("limit") || "20");
  const status = url.get("status");
  const isAdmin = hasPermission(session.user.role, "orders.view");

  const where: Record<string, unknown> = {};
  if (!isAdmin) where.userId = session.user.id;
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        payment: { select: { method: true, status: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.order.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/orders — place order (checkout)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please log in" }, { status: 401 });
  }
  const limiter = await rateLimit(`orders:create:${session.user.id}`, 6, 300);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait and try again." },
      { status: 429, headers: rateLimitHeaders(limiter) }
    );
  }

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { addressId, paymentMethod, transactionId, senderPhone, screenshotUrl, couponCode, notes } = parsed.data;

  // Require TxID for bKash/Nagad
  if ((paymentMethod === "BKASH" || paymentMethod === "NAGAD") && !transactionId) {
    return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
  }

  // Validate address ownership
  const address = await db.address.findFirst({
    where: { id: addressId, userId: session.user.id },
  });
  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 400 });
  }

  // Get cart items
  const cartItems = await db.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      variant: {
        include: { product: true },
      },
    },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Calculate subtotal
  let subtotal = 0;
  const orderItems: Array<{
    variantId: string;
    productName: string;
    variantInfo: Prisma.InputJsonValue;
    quantity: number;
    unitPrice: number;
    total: number;
  }> = [];

  for (const item of cartItems) {
    const price = item.variant.salePrice ?? item.variant.price;

    // Check stock with current data
    if (item.quantity > item.variant.stock) {
      return NextResponse.json(
        { error: `${item.variant.product.name} (${item.variant.sku}) only has ${item.variant.stock} in stock` },
        { status: 400 }
      );
    }

    const lineTotal = price * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      variantId: item.variantId,
      productName: item.variant.product.name,
      variantInfo: item.variant.attributes as Prisma.InputJsonValue,
      quantity: item.quantity,
      unitPrice: price,
      total: lineTotal,
    });
  }

  // Calculate shipping
  const shippingZones = await db.shippingZone.findMany();
  const matchedZone = shippingZones.find((z) => {
    return z.divisions.some((d: string) => d.toLowerCase() === address.division.toLowerCase());
  });
  const shippingCost = matchedZone?.flatRate ?? 0;

  // Apply coupon
  let discount = 0;
  let couponId: string | null = null;
  if (couponCode) {
    const coupon = await db.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        isActive: true,
        OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
      },
    });

    if (coupon) {
      const validTo = coupon.validTo;
      const withinLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
      const notExpired = !validTo || validTo >= new Date();

      if (withinLimit && notExpired) {
        const meetsMinimum = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;
        if (meetsMinimum) {
          if (coupon.type === "PERCENTAGE") {
            discount = Math.round(subtotal * coupon.value / 100);
            if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
          } else {
            discount = coupon.value;
          }
          couponId = coupon.id;
        }
      }
    }
  }

  const total = subtotal + shippingCost - discount;

  // Create order with optimistic stock decrement in a transaction
  const order = await db.$transaction(async (tx) => {
    // Decrement stock for each variant
    for (const item of cartItems) {
      const updated = await tx.productVariant.updateMany({
        where: {
          id: item.variantId,
          stock: { gte: item.quantity }, // optimistic lock
        },
        data: { stock: { decrement: item.quantity } },
      });

      if (updated.count === 0) {
        throw new Error(`Insufficient stock for ${item.variant.product.name} (${item.variant.sku})`);
      }
    }

    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session.user!.id!,
        status: "PENDING",
        subtotal,
        shippingCost,
        discount,
        total,
        shippingAddressId: addressId,
        notes,
        couponId,
        items: { create: orderItems as Prisma.OrderItemUncheckedCreateWithoutOrderInput[] },
        payment: {
          create: {
            method: paymentMethod,
            amount: total,
            transactionId: transactionId || null,
            senderPhone: senderPhone || null,
            screenshotUrl: screenshotUrl || null,
            status: "PENDING_VERIFICATION",
            paidAt: paymentMethod !== "COD" ? new Date() : null,
          },
        },
      },
      include: { items: true, payment: true },
    });

    // Increment coupon usage
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { userId: session.user!.id! },
    });

    return newOrder;
  });

  // Send Discord notification (fire-and-forget)
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  notifyPaymentSubmitted({
    orderNumber: order.orderNumber,
    customerName: user?.name || "Unknown",
    customerPhone: user?.phone || senderPhone || "N/A",
    method: paymentMethod,
    amount: total,
    transactionId: transactionId || undefined,
    screenshotUrl: screenshotUrl || undefined,
    orderId: order.id,
  }).catch(console.error);

  sendAdminPushNotification({
    title: `New order ${order.orderNumber}`,
    message: `Payment submitted via ${paymentMethod}. Review in admin panel.`,
    type: "ORDER_CREATED",
    priority: "HIGH",
    entity: "order",
    entityId: order.id,
  }).catch(console.error);

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
  }, { status: 201 });
}
