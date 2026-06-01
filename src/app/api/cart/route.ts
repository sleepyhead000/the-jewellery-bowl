import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";
import { resolveVariantSalePrice } from "@/lib/sales";

// GET /api/cart — fetch current user's cart
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ items: [], total: 0 });
  }

  const items = await db.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  const now = new Date();
  const mapped = items.map((item) => {
    const salePrice = resolveVariantSalePrice(item.variant, now);
    return {
      id: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      variant: {
        id: item.variant.id,
        sku: item.variant.sku,
        price: salePrice ?? item.variant.price,
        originalPrice: salePrice ? item.variant.price : null,
        stock: item.variant.stock,
        attributes: item.variant.attributes,
      },
      product: {
        id: item.variant.product.id,
        name: item.variant.product.name,
        slug: item.variant.product.slug,
        image: item.variant.product.images[0]?.url || null,
      },
    };
  });

  const total = mapped.reduce((sum, i) => sum + i.variant.price * i.quantity, 0);

  return NextResponse.json({ items: mapped, total });
}

// POST /api/cart — add item
export async function POST(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `cart:post:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { variantId, quantity = 1 } = await req.json();
  if (!variantId || quantity < 1) {
    return validationError(context.requestId, "Invalid input");
  }

  // Validate variant exists and has stock
  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || !variant.isActive) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  // Upsert: add or increment
  const existing = await db.cartItem.findUnique({
    where: { userId_variantId: { userId: context.userId!, variantId } },
  });

  const newQty = (existing?.quantity || 0) + quantity;
  if (newQty > variant.stock) {
    return validationError(context.requestId, `Only ${variant.stock} available`);
  }

  const item = await db.cartItem.upsert({
    where: { userId_variantId: { userId: context.userId!, variantId } },
    update: { quantity: newQty },
    create: { userId: context.userId!, variantId, quantity },
  });

  return withRequestId(context.requestId, item);
}

// PATCH /api/cart — update quantity
export async function PATCH(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `cart:patch:${userId ?? "anon"}`,
    rateLimitMax: 80,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { variantId, quantity } = await req.json();
  if (!variantId || quantity < 0) {
    return validationError(context.requestId, "Invalid input");
  }

  if (quantity === 0) {
    await db.cartItem.deleteMany({
      where: { userId: context.userId!, variantId },
    });
    return withRequestId(context.requestId, { deleted: true });
  }

  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }
  if (quantity > variant.stock) {
    return validationError(context.requestId, `Only ${variant.stock} available`);
  }

  const item = await db.cartItem.update({
    where: { userId_variantId: { userId: context.userId!, variantId } },
    data: { quantity },
  });

  return withRequestId(context.requestId, item);
}

// DELETE /api/cart — remove item or clear cart
export async function DELETE(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `cart:delete:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { variantId } = await req.json().catch(() => ({ variantId: null }));

  if (variantId) {
    await db.cartItem.deleteMany({
      where: { userId: context.userId!, variantId },
    });
  } else {
    // Clear entire cart
    await db.cartItem.deleteMany({
      where: { userId: context.userId! },
    });
  }

  return withRequestId(context.requestId, { deleted: true });
}
