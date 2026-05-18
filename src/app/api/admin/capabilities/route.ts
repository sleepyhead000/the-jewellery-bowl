import { NextRequest } from "next/server";
import { getRolePermissions } from "@/lib/permissions";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";

export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:capabilities:${userId ?? "anon"}`,
    rateLimitMax: 120,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  if (!context.role) {
    return withRequestId(context.requestId, { permissions: [] as string[] });
  }

  return withRequestId(context.requestId, {
    role: context.role,
    permissions: getRolePermissions(context.role),
  });
}
