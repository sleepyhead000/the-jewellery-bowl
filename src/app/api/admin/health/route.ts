import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "orders.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  return NextResponse.json({
    status: Object.values(checks).includes("error") ? "degraded" : "ok",
    checks,
    timestamp: new Date().toISOString(),
  });
}

