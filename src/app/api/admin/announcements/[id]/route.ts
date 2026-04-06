import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/announcements/[id]
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  return NextResponse.json(announcement);
}

// DELETE /api/admin/announcements/[id]
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
