import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/announcements — public, returns active announcements
export async function GET() {
  const now = new Date();

  const announcements = await db.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { startAt: null },
        { startAt: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endAt: null },
            { endAt: { gte: now } },
          ],
        },
      ],
    },
    orderBy: { sortOrder: "asc" },
    select: { id: true, text: true, link: true },
  });

  return NextResponse.json(announcements);
}
