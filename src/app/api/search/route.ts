import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
  canSearchQuery,
  normalizeSearchQuery,
  SEARCH_MAX_RESULTS,
  type SearchResponse,
  type SearchSuggestion,
} from "@/lib/search";
import { resolveVariantSalePrice } from "@/lib/sales";

type ProductSearchRow = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  variantPrice: number | null;
  score: number;
  imageUrl: string | null;
  salePrice: number | null;
  saleEnabled: boolean | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
};

const isPostgresDatabase = (): boolean => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
};

const mapToSearchSuggestion = (row: ProductSearchRow): SearchSuggestion => {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.imageUrl,
    price: row.variantPrice ?? row.basePrice,
    salePrice: row.variantPrice
      ? resolveVariantSalePrice({
          id: row.id,
          price: row.variantPrice,
          salePrice: row.salePrice,
          saleEnabled: row.saleEnabled ?? false,
          saleStartsAt: row.saleStartsAt,
          saleEndsAt: row.saleEndsAt,
        }, new Date())
      : null,
    score: row.score,
  };
};

const searchWithPostgres = async (query: string): Promise<SearchSuggestion[]> => {
  const rows = await db.$queryRaw<ProductSearchRow[]>(Prisma.sql`
    SELECT
      p.id,
      p.slug,
      p.name,
      p."basePrice" AS "basePrice",
      ts_rank(
        to_tsvector('simple', coalesce(p.name, '') || ' ' || coalesce(p.description, '')),
        websearch_to_tsquery('simple', ${query})
      ) AS score,
      (
        SELECT pi.url
        FROM "ProductImage" pi
        WHERE pi."productId" = p.id
        ORDER BY pi."sortOrder" ASC
        LIMIT 1
      ) AS "imageUrl",
      (
        SELECT pv.price
        FROM "ProductVariant" pv
        WHERE pv."productId" = p.id AND pv."isActive" = true
        ORDER BY pv.price ASC
        LIMIT 1
      ) AS "variantPrice",
      (
        SELECT pv."salePrice"
        FROM "ProductVariant" pv
        WHERE pv."productId" = p.id AND pv."isActive" = true
        ORDER BY pv.price ASC
        LIMIT 1
      ) AS "salePrice"
      ,
      (
        SELECT pv."saleEnabled"
        FROM "ProductVariant" pv
        WHERE pv."productId" = p.id AND pv."isActive" = true
        ORDER BY pv.price ASC
        LIMIT 1
      ) AS "saleEnabled",
      (
        SELECT pv."saleStartsAt"
        FROM "ProductVariant" pv
        WHERE pv."productId" = p.id AND pv."isActive" = true
        ORDER BY pv.price ASC
        LIMIT 1
      ) AS "saleStartsAt",
      (
        SELECT pv."saleEndsAt"
        FROM "ProductVariant" pv
        WHERE pv."productId" = p.id AND pv."isActive" = true
        ORDER BY pv.price ASC
        LIMIT 1
      ) AS "saleEndsAt"
    FROM "Product" p
    WHERE
      p.status = 'ACTIVE'
      AND (
        to_tsvector('simple', coalesce(p.name, '') || ' ' || coalesce(p.description, ''))
          @@ websearch_to_tsquery('simple', ${query})
        OR lower(p.name) LIKE ${`%${query}%`}
      )
    ORDER BY score DESC, p.name ASC
    LIMIT ${SEARCH_MAX_RESULTS}
  `);

  return rows.map(mapToSearchSuggestion);
};

const searchWithSqlite = async (query: string): Promise<SearchSuggestion[]> => {
  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      basePrice: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      variants: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        take: 1,
        select: { id: true, price: true, salePrice: true, saleEnabled: true, saleStartsAt: true, saleEndsAt: true },
      },
    },
    take: SEARCH_MAX_RESULTS,
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
  });

  return products.map((item) => {
    const variant = item.variants[0];
    const salePrice = variant ? resolveVariantSalePrice(variant, new Date()) : null;
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      imageUrl: item.images[0]?.url ?? null,
      price: variant?.price ?? item.basePrice,
      salePrice,
      score: undefined,
    };
  });
};

export async function GET(req: NextRequest) {
  const rawQuery = req.nextUrl.searchParams.get("q") ?? "";
  const query = normalizeSearchQuery(rawQuery);
  if (!canSearchQuery(query)) {
    const emptyResponse: SearchResponse = { results: [] };
    return NextResponse.json(emptyResponse);
  }

  const results = isPostgresDatabase()
    ? await searchWithPostgres(query)
    : await searchWithSqlite(query);

  const response: SearchResponse = { results };
  return NextResponse.json(response);
}
