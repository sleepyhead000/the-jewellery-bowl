import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/announcements/[id]
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:announcements:update:${userId ?? "anon"}`,
    rateLimitMax: 40,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { text, link, isActive, sortOrder, startAt, endAt } = body as {
    text?: string;
    link?: string | null;
    isActive?: boolean;
    sortOrder?: number;
    startAt?: string | null;
    endAt?: string | null;
  };

  const data: Record<string, unknown> = {};
  if (text !== undefined) data.text = text.trim();
  if (link !== undefined) data.link = link?.trim() || null;
  if (isActive !== undefined) data.isActive = isActive;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;
  if (startAt !== undefined) data.startAt = startAt ? new Date(startAt) : null;
  if (endAt !== undefined) data.endAt = endAt ? new Date(endAt) : null;

  const announcement = await db.announcement.update({
    where: { id },
    data,
  });

  return withRequestId(context.requestId, announcement);
}

// DELETE /api/admin/announcements/[id]
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:announcements:delete:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const { id } = await params;
  await db.announcement.delete({ where: { id } });
  return withRequestId(context.requestId, { success: true });
}
