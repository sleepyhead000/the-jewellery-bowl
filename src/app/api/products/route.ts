import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
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

const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.number().int().positive(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  variants: z.array(variantSchema).optional(),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    sortOrder: z.number().int().optional(),
  })).optional(),
});

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams;
  const page = parseInt(url.get("page") || "1");
  const limit = parseInt(url.get("limit") || "20");
  const status = url.get("status");
  const categoryId = url.get("categoryId");
  const featured = url.get("featured");
  const search = url.get("search");
  const sort = url.get("sort") || "newest";
  const sale = url.get("sale");

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (featured === "true") where.isFeatured = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { tags: { has: search.toLowerCase() } },
    ];
  }
  if (sale === "true") {
    where.variants = { some: { salePrice: { not: null } } };
  }

  const orderBy: Record<string, string> = {};
  switch (sort) {
    case "newest": orderBy.createdAt = "desc"; break;
    case "oldest": orderBy.createdAt = "asc"; break;
    case "price-asc": orderBy.basePrice = "asc"; break;
    case "price-desc": orderBy.basePrice = "desc"; break;
    case "name": orderBy.name = "asc"; break;
    default: orderBy.createdAt = "desc";
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { price: "asc" } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        _count: { select: { reviews: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "products.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { variants, images, tags, ...productData } = parsed.data;
  const finalSlug = productData.slug || slugify(productData.name);

  const existing = await db.product.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    return NextResponse.json({ error: "Product with this slug already exists" }, { status: 409 });
  }

  const product = await db.product.create({
    data: {
      ...productData,
      slug: finalSlug,
      tags: tags || [],
      variants: variants
        ? { create: variants.map(({ attributes, ...v }) => ({ ...v, ...(attributes !== undefined && { attributes: attributes as Prisma.InputJsonValue }) })) }
        : undefined,
      images: images ? { create: images } : undefined,
    },
    include: {
      variants: true,
      images: true,
      category: true,
    },
  });
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PRODUCT_CREATED",
      entity: "PRODUCT",
      entityId: product.id,
      details: { name: product.name, slug: product.slug },
    },
  });

  return NextResponse.json(product, { status: 201 });
}
