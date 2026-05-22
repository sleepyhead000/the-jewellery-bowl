import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";
import { hasPermission } from "@/lib/permissions";

// GET /api/coupons — admin: list all; customer: validate code
export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    rateLimitKey: (_req, userId) => `coupons:get:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const isAdmin = context.role ? hasPermission(context.role, "settings.manage") : false;
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");
  if (code && !isAdmin) {
    const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      return validationError(context.requestId, "Invalid coupon code");
    }
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return validationError(context.requestId, "Coupon not yet valid");
    }
    if (coupon.validTo && now > coupon.validTo) {
      return validationError(context.requestId, "Coupon expired");
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return validationError(context.requestId, "Coupon usage limit reached");
    }
    return withRequestId(context.requestId, {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
    });
  }

  if (!isAdmin) {
    return validationError(context.requestId, "Coupon code required");
  }

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return withRequestId(context.requestId, coupons);
}

// POST /api/coupons — admin: create
export async function POST(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `coupons:create:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

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
    return validationError(context.requestId, "code, type, and value required");
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

  if (context.userId) {
    await db.auditLog.create({
      data: {
        userId: context.userId,
        action: "COUPON_CREATED",
        entity: "COUPON",
        entityId: coupon.id,
        details: { code: coupon.code, type: coupon.type, value: coupon.value, requestId: context.requestId },
      },
    });
  }

  return withRequestId(context.requestId, coupon, { status: 201 });
}
