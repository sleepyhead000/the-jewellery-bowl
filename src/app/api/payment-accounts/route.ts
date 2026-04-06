import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

// GET /api/payment-accounts — public (active only) or admin (all)
export async function GET() {
  const session = await auth();
  const isAdmin = session?.user && hasPermission(session.user.role, "settings.manage");

  const accounts = await db.paymentAccount.findMany({
    where: isAdmin ? {} : { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(accounts);
}

// POST /api/payment-accounts — admin only
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { method, accountNumber, accountName } = await req.json();
  if (!method || !accountNumber) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const account = await db.paymentAccount.create({
    data: { method, accountNumber, accountName },
  });

  return NextResponse.json(account, { status: 201 });
}
