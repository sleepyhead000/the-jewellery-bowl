import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}

// PATCH /api/profile
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { name?: string; email?: string };
  const data: Record<string, string> = {};

  if (body.name !== undefined) data.name = body.name.trim();
  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (email) {
      const existing = await db.user.findFirst({
        where: { email, NOT: { id: session.user.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }
    data.email = email || "";
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true, phone: true, avatar: true, createdAt: true },
  });

  return NextResponse.json(user);
}
