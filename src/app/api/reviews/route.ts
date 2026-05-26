import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";

// GET /api/reviews?productId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const reviews = await db.review.findMany({
    where: { productId, isApproved: true },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const stats = await db.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });

  return NextResponse.json({
    reviews,
    average: stats._avg.rating || 0,
    count: stats._count,
  });
}

// POST /api/reviews — submit review
export async function POST(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `reviews:post:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { productId, rating, comment } = (await req.json()) as {
    productId: string;
    rating: number;
    comment?: string;
  };

  if (!productId || !rating || rating < 1 || rating > 5) {
    return validationError(context.requestId, "productId and rating (1-5) required");
  }

  // Check if user has purchased this product
  const hasPurchased = await db.orderItem.findFirst({
    where: {
      order: { userId: context.userId!, status: "DELIVERED" },
      variant: { productId },
    },
  });

  if (!hasPurchased) {
    return NextResponse.json({ error: "You can only review products you've purchased" }, { status: 403 });
  }

  // Check existing review
  const existing = await db.review.findUnique({
    where: { productId_userId: { productId, userId: context.userId! } },
  });

  if (existing) {
    const updated = await db.review.update({
      where: { id: existing.id },
      data: { rating, comment: comment?.trim() || null, isApproved: false },
    });
    return NextResponse.json(updated);
  }

  const review = await db.review.create({
    data: {
      productId,
      userId: context.userId!,
      rating,
      comment: comment?.trim() || null,
    },
  });

  return withRequestId(context.requestId, review, { status: 201 });
}
