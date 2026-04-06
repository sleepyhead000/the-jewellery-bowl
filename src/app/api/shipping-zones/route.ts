import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

// GET /api/shipping-zones — public
export async function GET() {
  const zones = await db.shippingZone.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(zones);
}

// POST /api/shipping-zones — admin only
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, divisions, flatRate } = await req.json();
  if (!name || !divisions?.length || flatRate == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const zone = await db.shippingZone.create({
    data: { name, divisions, flatRate },
  });

  return NextResponse.json(zone, { status: 201 });
}
