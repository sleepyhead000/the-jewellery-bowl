import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

// GET /api/admin/announcements — list all announcements for admin
export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const announcements = await db.announcement.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(announcements);
}

// POST /api/admin/announcements — create announcement
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
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

  return NextResponse.json(announcement, { status: 201 });
}
