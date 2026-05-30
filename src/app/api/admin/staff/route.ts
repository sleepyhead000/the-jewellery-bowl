import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";
import type { Prisma } from "@/generated/prisma/client";

const staffRoleValues = ["STAFF", "MANAGER", "ADMIN"] as const satisfies readonly Role[];
const staffRoles: Role[] = ["STAFF", "MANAGER", "ADMIN"];

const createStaffSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(staffRoleValues),
});

const updateStaffSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(staffRoleValues),
});

const ensureStaffManager = async (): Promise<{ userId: string } | NextResponse> => {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "staff.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: session.user.id };
};

const countAdmins = async (): Promise<number> => {
  return db.user.count({ where: { role: "ADMIN" } });
};

const isProtectedAdminChange = async (userId: string, nextRole: Role): Promise<boolean> => {
  if (nextRole === "ADMIN") {
    return false;
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return false;
  }

  return (await countAdmins()) <= 1;
};

export async function GET(req: NextRequest) {
  const manager = await ensureStaffManager();
  if (manager instanceof NextResponse) return manager;

  const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
  const where: Prisma.UserWhereInput = {
    role: { in: staffRoles },
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  const staff = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const manager = await ensureStaffManager();
  if (manager instanceof NextResponse) return manager;

  const parsed = createStaffSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, name, role } = parsed.data;
  const user = await db.user.upsert({
    where: { email },
    update: {
      name,
      role,
      emailVerified: new Date(),
    },
    create: {
      email,
      name,
      role,
      emailVerified: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ staff: user }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const manager = await ensureStaffManager();
  if (manager instanceof NextResponse) return manager;

  const parsed = updateStaffSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, name, role } = parsed.data;
  if (id === manager.userId && role !== "ADMIN") {
    return NextResponse.json({ error: "You cannot remove your own admin access." }, { status: 400 });
  }

  if (await isProtectedAdminChange(id, role)) {
    return NextResponse.json({ error: "At least one admin must remain." }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id },
    data: {
      name,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ staff: user });
}

export async function DELETE(req: NextRequest) {
  const manager = await ensureStaffManager();
  if (manager instanceof NextResponse) return manager;

  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Staff id is required." }, { status: 400 });
  }

  if (id === manager.userId) {
    return NextResponse.json({ error: "You cannot remove your own admin access." }, { status: 400 });
  }

  if (await isProtectedAdminChange(id, "CUSTOMER")) {
    return NextResponse.json({ error: "At least one admin must remain." }, { status: 400 });
  }

  await db.user.update({
    where: { id },
    data: { role: "CUSTOMER" },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
