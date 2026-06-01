import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { normalizeSaleSettings } from "@/lib/sales";

const variantSchema = z.object({
  sku: z.string().trim().optional(),
  price: z.number().int().positive(),
  salePrice: z.number().int().positive().optional().nullable(),
  saleEnabled: z.boolean().optional(),
  saleStartsAt: z.coerce.date().optional().nullable(),
  saleEndsAt: z.coerce.date().optional().nullable(),
  saleDiscountType: z.enum(["PRICE", "PERCENT"]).optional(),
  saleDiscountValue: z.number().int().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  weight: z.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
});

type VariantInput = z.infer<typeof variantSchema>;

function normalizeVariantSale(variant: VariantInput): VariantInput {
  return { ...variant, ...normalizeSaleSettings(variant) };
}

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

  let normalizedVariant: VariantInput;
  try {
    normalizedVariant = normalizeVariantSale(parsed.data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid sale settings" }, { status: 400 });
  }

  const normalizedSku = normalizedVariant.sku?.trim();
  const sku = normalizedSku && normalizedSku.length > 0 ? normalizedSku : await generateVariantSku(id);
  const existing = await db.productVariant.findUnique({ where: { sku } });
  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
  }

  const { attributes, ...variantData } = normalizedVariant;
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

  let normalizedVariant = parsed.data;
  if (parsed.data.price !== undefined || parsed.data.saleEnabled !== undefined || parsed.data.saleDiscountType !== undefined || parsed.data.saleDiscountValue !== undefined || parsed.data.salePrice !== undefined) {
    const current = await db.productVariant.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }
    try {
      normalizedVariant = {
        ...parsed.data,
        ...normalizeSaleSettings({
          price: parsed.data.price ?? current.price,
          salePrice: parsed.data.salePrice ?? current.salePrice,
          saleEnabled: parsed.data.saleEnabled ?? current.saleEnabled,
          saleStartsAt: parsed.data.saleStartsAt ?? current.saleStartsAt,
          saleEndsAt: parsed.data.saleEndsAt ?? current.saleEndsAt,
          saleDiscountType: parsed.data.saleDiscountType ?? (current.saleDiscountType as "PRICE" | "PERCENT"),
          saleDiscountValue: parsed.data.saleDiscountValue ?? current.saleDiscountValue,
        }),
      };
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid sale settings" }, { status: 400 });
    }
  }

  const { attributes, ...variantData } = normalizedVariant;
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
