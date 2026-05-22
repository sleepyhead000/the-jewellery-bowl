import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";

// GET /api/payment-accounts — public (active only) or admin (all)
export async function GET(req: NextRequest) {
  const { context } = await runSecurityChecks(req, {
    authMode: "public",
    rateLimitKey: () => "payment-accounts:get:public",
    rateLimitMax: 120,
    rateLimitWindowSeconds: 300,
  });

  const isAdmin = context.role ? hasPermission(context.role, "settings.manage") : false;

  const accounts = await db.paymentAccount.findMany({
    where: isAdmin ? {} : { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (isAdmin) {
    return withRequestId(context.requestId, accounts);
  }

  const publicAccounts = accounts.map((account) => ({
    id: account.id,
    method: account.method,
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    isActive: account.isActive,
  }));

  return withRequestId(context.requestId, publicAccounts);
}

// POST /api/payment-accounts — admin only
export async function POST(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `payment-accounts:create:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { method, accountNumber, accountName } = await req.json();
  if (!method || !accountNumber) {
    return validationError(context.requestId, "Missing fields");
  }

  const account = await db.paymentAccount.create({
    data: { method, accountNumber, accountName },
  });

  return withRequestId(context.requestId, account, { status: 201 });
}
