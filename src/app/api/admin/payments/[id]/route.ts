import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { applyPaymentAction, PaymentActionError } from "@/lib/payment-actions";
import { validateOriginForMutations } from "@/lib/api-security";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const paymentActionSchema = z.object({
  action: z.enum(["verify", "reject"]),
  adminNote: z.string().trim().max(1000).nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "payments.verify")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      verifier: { select: { id: true, name: true, email: true } },
      order: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
          shippingAddress: true,
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
                  },
                },
              },
            },
          },
          coupon: true,
        },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json(payment);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "payments.verify")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const originErr = validateOriginForMutations(req, crypto.randomUUID());
  if (originErr) return originErr;

  const limiter = await rateLimit(`admin:payments:update:${session.user.id}`, 40, 300);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: rateLimitHeaders(limiter) }
    );
  }

  const parsed = paymentActionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const payment = await db.payment.findUnique({
    where: { id },
    select: { orderId: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  try {
    const result = await applyPaymentAction({
      orderId: payment.orderId,
      action: parsed.data.action,
      adminNote: parsed.data.adminNote?.trim() ? parsed.data.adminNote.trim() : null,
      actor: { id: session.user.id, name: session.user.name },
    });

    return NextResponse.json({ success: true, paymentStatus: result.paymentStatus, orderStatus: result.orderStatus });
  } catch (error) {
    if (error instanceof PaymentActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
