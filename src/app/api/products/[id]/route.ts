import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { normalizeSaleSettings } from "@/lib/sales";

const variantSchema = z.object({
  id: z.string().optional(),
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

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  basePrice: z.number().int().positive().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  variants: z.array(variantSchema).optional(),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    sortOrder: z.number().int().optional(),
  })).optional(),
});

type VariantInput = z.infer<typeof variantSchema>;

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

function normalizeVariantSale(variant: VariantInput): VariantInput {
  return { ...variant, ...normalizeSaleSettings(variant) };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Support lookup by ID or slug
  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      category: true,
      variants: { orderBy: { price: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: { where: { isApproved: true } } } },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { variants, images, ...data } = parsed.data;
  if (data.name && !data.slug) {
    data.slug = slugify(data.name);
  }

  let normalizedVariants: VariantInput[] | undefined;
  try {
    normalizedVariants = variants?.map(normalizeVariantSale);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid sale settings" }, { status: 400 });
  }

  let product;
  try {
    product = await db.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data,
        include: { variants: true, images: true, category: true },
      });

    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((image, index) => ({
            productId: id,
            url: image.url,
            alt: image.alt,
            sortOrder: image.sortOrder ?? index,
          })),
        });
      }
    }

    if (normalizedVariants) {
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id },
        select: { id: true },
      });
      const submittedIds = normalizedVariants
        .map((variant) => variant.id)
        .filter((variantId): variantId is string => Boolean(variantId));
      const removedIds = existingVariants
        .map((variant) => variant.id)
        .filter((variantId) => !submittedIds.includes(variantId));

      if (removedIds.length > 0) {
        const variantsWithOrders = await tx.orderItem.findMany({
          where: { variantId: { in: removedIds } },
          select: { variantId: true },
          distinct: ["variantId"],
        });
        const protectedIds = variantsWithOrders.map((entry) => entry.variantId);
        const deletableIds = removedIds.filter((variantId) => !protectedIds.includes(variantId));
        if (deletableIds.length > 0) {
          await tx.productVariant.deleteMany({ where: { id: { in: deletableIds } } });
        }
        if (protectedIds.length > 0) {
          await tx.productVariant.updateMany({ where: { id: { in: protectedIds } }, data: { isActive: false } });
        }
      }

      for (const variant of normalizedVariants) {
        const { id: variantId, attributes, ...variantData } = variant;
        const normalizedSku = variantData.sku?.trim();
        const sku = normalizedSku && normalizedSku.length > 0 ? normalizedSku : await generateVariantSku(id);
        const dataWithAttributes = {
          ...variantData,
          sku,
          ...(attributes !== undefined && { attributes: attributes as Prisma.InputJsonValue }),
        };

        if (variantId) {
          const result = await tx.productVariant.updateMany({
            where: { id: variantId, productId: id },
            data: dataWithAttributes,
          });
          if (result.count !== 1) {
            throw new Error("Variant does not belong to this product");
          }
        } else {
          await tx.productVariant.create({
            data: { ...dataWithAttributes, productId: id },
          });
        }
      }
    }

      return tx.product.findUniqueOrThrow({
        where: { id: updatedProduct.id },
        include: { variants: true, images: true, category: true },
      });
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" },
      { status: 400 }
    );
  }
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRODUCT_UPDATED",
      entity: "PRODUCT",
      entityId: id,
      details: { ...data, variantsUpdated: Boolean(normalizedVariants), imagesUpdated: Boolean(images) },
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "products.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const orderItemCount = await db.orderItem.count({
    where: { variant: { productId: id } },
  });

  if (orderItemCount > 0) {
    const product = await db.product.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PRODUCT_ARCHIVED_FOR_ORDER_HISTORY",
        entity: "PRODUCT",
        entityId: id,
        details: { name: product.name, orderItemCount },
      },
    });

    return NextResponse.json({
      success: true,
      archived: true,
      message: "Product has order history, so it was archived instead of deleted.",
    });
  }

  await db.product.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRODUCT_DELETED",
      entity: "PRODUCT",
      entityId: id,
    },
  });
  return NextResponse.json({ success: true });
}
