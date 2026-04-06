import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const addressSchema = z.object({
  label: z.string().optional(),
  division: z.string().min(1),
  district: z.string().min(1),
  area: z.string().optional(),
  street: z.string().min(1),
  postalCode: z.string().optional(),
  phone: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });

  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // If this is set as default, unset others
  if (data.isDefault) {
    await db.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  // If this is the first address, make it default
  const count = await db.address.count({ where: { userId: session.user.id } });
  if (count === 0) data.isDefault = true;

  const address = await db.address.create({
    data: { ...data, userId: session.user.id },
  });

  return NextResponse.json(address, { status: 201 });
}
