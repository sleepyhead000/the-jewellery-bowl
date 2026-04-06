import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const mapped = items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    quantity: item.quantity,
    variant: {
      id: item.variant.id,
      sku: item.variant.sku,
      price: item.variant.salePrice ?? item.variant.price,
      originalPrice: item.variant.salePrice ? item.variant.price : null,
      stock: item.variant.stock,
      attributes: item.variant.attributes,
    },
    product: {
      id: item.variant.product.id,
      name: item.variant.product.name,
      slug: item.variant.product.slug,
      image: item.variant.product.images[0]?.url || null,
    },
  }));

  const total = mapped.reduce((sum, i) => sum + i.variant.price * i.quantity, 0);

  return NextResponse.json({ items: mapped, total });
}

// POST /api/cart — add item
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please log in to add to cart" }, { status: 401 });
  }

  const { variantId, quantity = 1 } = await req.json();
  if (!variantId || quantity < 1) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Validate variant exists and has stock
  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || !variant.isActive) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  // Upsert: add or increment
  const existing = await db.cartItem.findUnique({
    where: { userId_variantId: { userId: session.user.id, variantId } },
  });

  const newQty = (existing?.quantity || 0) + quantity;
  if (newQty > variant.stock) {
    return NextResponse.json({ error: `Only ${variant.stock} available` }, { status: 400 });
  }

  const item = await db.cartItem.upsert({
    where: { userId_variantId: { userId: session.user.id, variantId } },
    update: { quantity: newQty },
    create: { userId: session.user.id, variantId, quantity },
  });

  return NextResponse.json(item);
}

// PATCH /api/cart — update quantity
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { variantId, quantity } = await req.json();
  if (!variantId || quantity < 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (quantity === 0) {
    await db.cartItem.deleteMany({
      where: { userId: session.user.id, variantId },
    });
    return NextResponse.json({ deleted: true });
  }

  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }
  if (quantity > variant.stock) {
    return NextResponse.json({ error: `Only ${variant.stock} available` }, { status: 400 });
  }

  const item = await db.cartItem.update({
    where: { userId_variantId: { userId: session.user.id, variantId } },
    data: { quantity },
  });

  return NextResponse.json(item);
}

// DELETE /api/cart — remove item or clear cart
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { variantId } = await req.json().catch(() => ({ variantId: null }));

  if (variantId) {
    await db.cartItem.deleteMany({
      where: { userId: session.user.id, variantId },
    });
  } else {
    // Clear entire cart
    await db.cartItem.deleteMany({
      where: { userId: session.user.id },
    });
  }

  return NextResponse.json({ deleted: true });
}
