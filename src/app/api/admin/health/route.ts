import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";

export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "orders.view",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:health:${userId ?? "anon"}`,
    rateLimitMax: 30,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const checks: Record<string, string> = {
    database: "ok",
    redis: "ok",
    vapid: process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? "ok" : "missing",
    discord: process.env.DISCORD_WEBHOOK_URL ? "ok" : "missing",
  };

  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    checks.database = "error";
  }

  try {
    await redis.ping();
  } catch {
    checks.redis = "error";
  }

  return withRequestId(context.requestId, {
    status: Object.values(checks).includes("error") ? "degraded" : "ok",
    checks,
    timestamp: new Date().toISOString(),
  });
}
