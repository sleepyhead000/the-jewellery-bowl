import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const variantSchema = z.object({
  sku: z.string().min(1),
  price: z.number().int().positive(),
  salePrice: z.number().int().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  weight: z.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = variantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.productVariant.findUnique({ where: { sku: parsed.data.sku } });
  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
  }

  const { attributes, ...variantData } = parsed.data;
  const variant = await db.productVariant.create({
    data: { ...variantData, productId: id, ...(attributes !== undefined && { attributes: attributes as Prisma.InputJsonValue }) },
  });

  return NextResponse.json(variant, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Here `id` is the variant ID
  const { id } = await params;
  const body = await req.json();
  const parsed = variantSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { attributes, ...variantData } = parsed.data;
  const variant = await db.productVariant.update({
    where: { id },
    data: { ...variantData, ...(attributes !== undefined && { attributes: attributes as Prisma.InputJsonValue }) },
  });

  return NextResponse.json(variant);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.productVariant.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
