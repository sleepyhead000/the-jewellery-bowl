import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runSecurityChecks, validationError, withRequestId } from "@/lib/api-security";

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
  const { context, error } = await runSecurityChecks(req, {
    authMode: "authenticated",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `profile:update:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const body = (await req.json()) as { name?: string; email?: string };
  const data: Record<string, string> = {};

  if (body.name !== undefined) data.name = body.name.trim();
  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return validationError(context.requestId, "Invalid email");
    }
    if (email) {
      const existing = await db.user.findFirst({
        where: { email, NOT: { id: context.userId! } },
      });
      if (existing) {
        return validationError(context.requestId, "Unable to update profile details");
      }
    }
    data.email = email || "";
  }

  const user = await db.user.update({
    where: { id: context.userId! },
    data,
    select: { id: true, name: true, email: true, phone: true, avatar: true, createdAt: true },
  });

  return withRequestId(context.requestId, user);
}
