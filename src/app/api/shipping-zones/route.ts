import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";

// GET /api/shipping-zones — public
export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "public",
    rateLimitKey: () => "shipping-zones:get:public",
    rateLimitMax: 120,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const zones = await db.shippingZone.findMany({ orderBy: { name: "asc" } });
  return withRequestId(context.requestId, zones);
}

// POST /api/shipping-zones — admin only
export async function POST(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `shipping-zones:create:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { name, divisions, flatRate } = await req.json();
  if (!name || !divisions?.length || flatRate == null) {
    return validationError(context.requestId, "Missing fields");
  }

  const zone = await db.shippingZone.create({
    data: { name, divisions, flatRate },
  });

  return withRequestId(context.requestId, zone, { status: 201 });
}
