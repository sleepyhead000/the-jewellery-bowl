import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/reviews/[id] — approve/reject review (admin)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "reviews.moderate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { isApproved } = (await req.json()) as { isApproved: boolean };

  const review = await db.review.update({
    where: { id },
    data: { isApproved },
  });

  return NextResponse.json(review);
}

// DELETE /api/reviews/[id]
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "reviews.moderate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.review.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
