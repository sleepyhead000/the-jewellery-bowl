import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { slugify } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CopiedVariant = {
  oldId: string;
  sku: string;
  price: number;
  salePrice: number | null;
  saleEnabled: boolean;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
  saleDiscountType: string;
  saleDiscountValue: number | null;
  stock: number;
  attributes: Prisma.InputJsonValue | undefined;
  weight: number | null;
  isActive: boolean;
};

const buildCopiedName = (name: string): string => `${name}(copy)`;

const findUniqueProductSlug = async (baseSlug: string): Promise<string> => {
  const normalizedBaseSlug = baseSlug.length > 0 ? baseSlug : "product-copy";
  let attempt = 1;

  while (attempt <= 1000) {
    const candidate = attempt === 1 ? normalizedBaseSlug : `${normalizedBaseSlug}-${attempt}`;
    const existing = await db.product.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    attempt += 1;
  }

  throw new Error("Unable to generate a unique product slug for copied product");
};

const findUniqueVariantSku = async (baseSku: string): Promise<string> => {
  const normalizedBaseSku = baseSku.trim().length > 0 ? baseSku.trim() : "VARIANT";
  const copiedBaseSku = `${normalizedBaseSku}-COPY`;
  let attempt = 1;

  while (attempt <= 1000) {
    const candidate = attempt === 1 ? copiedBaseSku : `${copiedBaseSku}-${attempt}`;
    const existing = await db.productVariant.findUnique({ where: { sku: candidate } });
    if (!existing) return candidate;
    attempt += 1;
  }

  throw new Error("Unable to generate a unique variant SKU for copied product");
};

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "products.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const sourceProduct = await db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { id: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!sourceProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const copiedName = buildCopiedName(sourceProduct.name);
  const copiedSlug = await findUniqueProductSlug(slugify(copiedName));
  const copiedVariants: CopiedVariant[] = await Promise.all(
    sourceProduct.variants.map(async (variant) => ({
      oldId: variant.id,
      sku: await findUniqueVariantSku(variant.sku),
      price: variant.price,
      salePrice: variant.salePrice,
      saleEnabled: variant.saleEnabled,
      saleStartsAt: variant.saleStartsAt,
      saleEndsAt: variant.saleEndsAt,
      saleDiscountType: variant.saleDiscountType,
      saleDiscountValue: variant.saleDiscountValue,
      stock: variant.stock,
      attributes: variant.attributes === null ? undefined : (variant.attributes as Prisma.InputJsonValue),
      weight: variant.weight,
      isActive: variant.isActive,
    }))
  );

  const copiedProduct = await db.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: {
        name: copiedName,
        slug: copiedSlug,
        description: sourceProduct.description,
        basePrice: sourceProduct.basePrice,
        status: "DRAFT",
        categoryId: sourceProduct.categoryId,
        tags: sourceProduct.tags as Prisma.InputJsonValue,
        isFeatured: sourceProduct.isFeatured,
        metaTitle: sourceProduct.metaTitle,
        metaDescription: sourceProduct.metaDescription,
        ...(copiedVariants.length > 0 && {
          variants: {
            create: copiedVariants.map((variant) => ({
              sku: variant.sku,
              price: variant.price,
              salePrice: variant.salePrice,
              saleEnabled: variant.saleEnabled,
              saleStartsAt: variant.saleStartsAt,
              saleEndsAt: variant.saleEndsAt,
              saleDiscountType: variant.saleDiscountType,
              saleDiscountValue: variant.saleDiscountValue,
              stock: variant.stock,
              weight: variant.weight,
              isActive: variant.isActive,
              ...(variant.attributes !== undefined && { attributes: variant.attributes }),
            })),
          },
        }),
      },
      include: { variants: true, images: true, category: true },
    });

    const newVariantIdBySku = new Map(createdProduct.variants.map((variant) => [variant.sku, variant.id]));
    const newVariantIdByOldId = new Map(
      copiedVariants
        .map((variant) => [variant.oldId, newVariantIdBySku.get(variant.sku)] as const)
        .filter((entry): entry is readonly [string, string] => typeof entry[1] === "string")
    );

    if (sourceProduct.images.length > 0) {
      await tx.productImage.createMany({
        data: sourceProduct.images.map((image) => ({
          productId: createdProduct.id,
          variantId: image.variantId ? newVariantIdByOldId.get(image.variantId) ?? null : null,
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PRODUCT_COPIED",
        entity: "PRODUCT",
        entityId: createdProduct.id,
        details: {
          sourceProductId: sourceProduct.id,
          sourceName: sourceProduct.name,
          copiedName,
          copiedSlug,
        },
      },
    });

    return tx.product.findUnique({
      where: { id: createdProduct.id },
      include: { variants: true, images: true, category: true },
    });
  });

  return NextResponse.json(copiedProduct, { status: 201 });
}
