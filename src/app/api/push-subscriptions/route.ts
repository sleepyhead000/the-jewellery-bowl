import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";

interface SubBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function POST(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `push-subscriptions:create:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const body = (await req.json()) as SubBody;
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  const sub = await db.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: {
      userId: context.userId!,
      keys: body.keys,
    },
    create: {
      userId: context.userId!,
      endpoint: body.endpoint,
      keys: body.keys,
    },
  });

  return withRequestId(context.requestId, { id: sub.id, ok: true });
}

export async function DELETE(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `push-subscriptions:delete:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const body = (await req.json()) as { endpoint?: string };
  if (!body.endpoint) return NextResponse.json({ error: "endpoint is required" }, { status: 400 });

  await db.pushSubscription.deleteMany({
    where: { userId: context.userId!, endpoint: body.endpoint },
  });

  return withRequestId(context.requestId, { ok: true });
}

export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    rateLimitKey: (_req, userId) => `push-subscriptions:key:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  return withRequestId(context.requestId, { publicKey, configured: publicKey.trim().length > 0 });
}
