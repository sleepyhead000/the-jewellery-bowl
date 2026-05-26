import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";

// GET /api/wishlist
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

// POST /api/wishlist — toggle wishlist (add/remove)
export async function POST(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `wishlist:post:${userId ?? "anon"}`,
    rateLimitMax: 40,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { productId } = (await req.json()) as { productId: string };
  if (!productId) {
    return validationError(context.requestId, "productId required");
  }

  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId: context.userId!, productId } },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    return withRequestId(context.requestId, { wishlisted: false });
  }

  await db.wishlistItem.create({
    data: { userId: context.userId!, productId },
  });

  return withRequestId(context.requestId, { wishlisted: true });
}
