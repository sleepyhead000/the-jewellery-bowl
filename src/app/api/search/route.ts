import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { tags: { has: query.toLowerCase() } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      variants: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        take: 1,
        select: { price: true, salePrice: true },
      },
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ results: products });
}
