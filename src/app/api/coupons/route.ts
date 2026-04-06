import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

// GET /api/coupons — admin: list all; customer: validate code
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = hasPermission(session.user.role, "settings.manage");
  const { searchParams } = new URL(req.url);

  // Customer: validate a coupon code
  const code = searchParams.get("code");
  if (code && !isAdmin) {
    const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
    }
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json({ error: "Coupon not yet valid" }, { status: 400 });
    }
    if (coupon.validTo && now > coupon.validTo) {
      return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }
    return NextResponse.json({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
    });
  }

  // Admin: list all
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json(coupons);
}

// POST /api/coupons — admin: create
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { code, type, value, minOrderAmount, maxDiscount, usageLimit, validFrom, validTo } = body as {
    code: string;
    type: string;
    value: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    validFrom?: string;
    validTo?: string;
  };

  if (!code || !type || !value) {
    return NextResponse.json({ error: "code, type, and value required" }, { status: 400 });
  }

  const coupon = await db.coupon.create({
    data: {
      code: code.toUpperCase().trim(),
      type,
      value,
      minOrderAmount: minOrderAmount || null,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validTo: validTo ? new Date(validTo) : null,
    },
  });

  return NextResponse.json(coupon, { status: 201 });
}
