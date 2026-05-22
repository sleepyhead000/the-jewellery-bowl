import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";

// GET /api/admin/announcements — list all announcements for admin
export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:announcements:list:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const announcements = await db.announcement.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return withRequestId(context.requestId, announcements);
}

// POST /api/admin/announcements — create announcement
export async function POST(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:announcements:create:${userId ?? "anon"}`,
    rateLimitMax: 30,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const body = await req.json();
  const { text, link, isActive, sortOrder, startAt, endAt } = body as {
    text: string;
    link?: string;
    isActive?: boolean;
    sortOrder?: number;
    startAt?: string;
    endAt?: string;
  };

  if (!text?.trim()) {
    return validationError(context.requestId, "Text is required");
  }

  const announcement = await db.announcement.create({
    data: {
      text: text.trim(),
      link: link?.trim() || null,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
    },
  });

  return withRequestId(context.requestId, announcement, { status: 201 });
}
