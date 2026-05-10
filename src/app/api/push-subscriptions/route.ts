import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

interface SubBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.role, "notifications.send")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as SubBody;
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  const sub = await db.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: {
      userId: session.user.id,
      keys: body.keys,
    },
    create: {
      userId: session.user.id,
      endpoint: body.endpoint,
      keys: body.keys,
    },
  });

  return NextResponse.json({ id: sub.id, ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user.role, "notifications.send")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { endpoint?: string };
  if (!body.endpoint) return NextResponse.json({ error: "endpoint is required" }, { status: 400 });

  await db.pushSubscription.deleteMany({
    where: { userId: session.user.id, endpoint: body.endpoint },
  });

  return NextResponse.json({ ok: true });
}

