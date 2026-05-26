import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";

// GET /api/notifications
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
  const unreadOnly = searchParams.get("unread") === "true";

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH /api/notifications — mark as read
export async function PATCH(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `notifications:patch:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { ids, all } = (await req.json()) as { ids?: string[]; all?: boolean };

  if (all) {
    await db.notification.updateMany({
      where: { userId: context.userId!, isRead: false },
      data: { isRead: true },
    });
  } else if (ids?.length) {
    await db.notification.updateMany({
      where: { id: { in: ids }, userId: context.userId! },
      data: { isRead: true },
    });
  }

  return withRequestId(context.requestId, { success: true });
}
