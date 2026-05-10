import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/coupons/[id]
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const coupon = await db.coupon.update({
    where: { id },
    data: body,
  });
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "COUPON_UPDATED",
      entity: "COUPON",
      entityId: id,
      details: body,
    },
  });

  return NextResponse.json(coupon);
}

// DELETE /api/coupons/[id]
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.coupon.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "COUPON_DELETED",
      entity: "COUPON",
      entityId: id,
    },
  });
  return NextResponse.json({ success: true });
}
