import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const variantSchema = z.object({
  sku: z.string().trim().optional(),
  price: z.number().int().positive(),
  salePrice: z.number().int().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  weight: z.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
});

const generateVariantSku = async (productId: string): Promise<string> => {
  let attempt = 0;
  while (attempt < 1000) {
    const candidate = `VAR-${productId.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}-${attempt + 1}`;
    const existing = await db.productVariant.findUnique({ where: { sku: candidate } });
    if (!existing) return candidate;
    attempt += 1;
  }
  throw new Error("Unable to generate unique SKU for variant");
};

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

  const normalizedSku = parsed.data.sku?.trim();
  const sku = normalizedSku && normalizedSku.length > 0 ? normalizedSku : await generateVariantSku(id);
  const existing = await db.productVariant.findUnique({ where: { sku } });
  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
  }

  const { attributes, ...variantData } = parsed.data;
  const variant = await db.productVariant.create({
    data: { ...variantData, sku, productId: id, ...(attributes !== undefined && { attributes: attributes as Prisma.InputJsonValue }) },
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
  const normalizedPatchSku = variantData.sku?.trim();
  if (normalizedPatchSku !== undefined) {
    variantData.sku = normalizedPatchSku;
  }
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
