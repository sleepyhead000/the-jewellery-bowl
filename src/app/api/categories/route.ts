import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const categories = await db.category.findMany({
    include: { children: true, _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "categories.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, slug, image, parentId, sortOrder } = parsed.data;
  const finalSlug = slug || slugify(name);

  const existing = await db.category.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    return NextResponse.json({ error: "Category with this slug already exists" }, { status: 409 });
  }

  const category = await db.category.create({
    data: { name, slug: finalSlug, image, parentId: parentId || null, sortOrder: sortOrder ?? 0 },
  });

  return NextResponse.json(category, { status: 201 });
}
