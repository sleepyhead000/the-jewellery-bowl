import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

const paymentStatuses = ["PENDING_VERIFICATION", "VERIFIED", "REJECTED"] as const;
const paymentMethods = ["BKASH", "NAGAD", "COD"] as const;

const parsePositiveInteger = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getStatusFilter = (value: string | null): string | null => {
  if (!value) return null;
  return paymentStatuses.includes(value as (typeof paymentStatuses)[number]) ? value : null;
};

const getMethodFilter = (value: string | null): string | null => {
  if (!value) return null;
  return paymentMethods.includes(value as (typeof paymentMethods)[number]) ? value : null;
};

const buildPaymentWhere = (req: NextRequest): Prisma.PaymentWhereInput => {
  const status = getStatusFilter(req.nextUrl.searchParams.get("status"));
  const method = getMethodFilter(req.nextUrl.searchParams.get("method"));
  const search = req.nextUrl.searchParams.get("search")?.trim();

  const where: Prisma.PaymentWhereInput = {
    ...(status ? { status } : {}),
    ...(method ? { method } : { method: { not: "COD" } }),
  };

  if (search && search.length > 0) {
    where.OR = [
      { transactionId: { contains: search, mode: "insensitive" } },
      { senderPhone: { contains: search } },
      { order: { orderNumber: { contains: search, mode: "insensitive" } } },
      { order: { user: { name: { contains: search, mode: "insensitive" } } } },
      { order: { user: { email: { contains: search, mode: "insensitive" } } } },
      { order: { user: { phone: { contains: search } } } },
    ];
  }

  return where;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "payments.verify")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = parsePositiveInteger(req.nextUrl.searchParams.get("page"), 1);
  const limit = Math.min(parsePositiveInteger(req.nextUrl.searchParams.get("limit"), 20), 50);
  const where = buildPaymentWhere(req);

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      include: {
        verifier: { select: { id: true, name: true, email: true } },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
            _count: { select: { items: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.payment.count({ where }),
  ]);

  return NextResponse.json({
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}
