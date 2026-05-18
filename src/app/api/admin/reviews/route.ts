import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";

// GET /api/admin/reviews — list reviews for admin with filter
export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "reviews.moderate",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:reviews:list:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "pending";

  const where =
    filter === "pending" ? { isApproved: false }
    : filter === "approved" ? { isApproved: true }
    : {};

  const reviews = await db.review.findMany({
    where,
    include: {
      user: { select: { name: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return withRequestId(context.requestId, reviews);
}
