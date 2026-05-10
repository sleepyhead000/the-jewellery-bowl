import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";

const KEY = "homepage_products";

type HomepageProductsSetting = {
  featuredIds: string[];
  popularIds: string[];
};

const defaults: HomepageProductsSetting = {
  featuredIds: [],
  popularIds: [],
};

function normalize(input: unknown): HomepageProductsSetting {
  const obj = typeof input === "object" && input ? (input as Record<string, unknown>) : {};

  const clean = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];

  return {
    featuredIds: clean(obj.featuredIds),
    popularIds: clean(obj.popularIds),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const setting = await db.setting.findUnique({ where: { key: KEY } });
  return NextResponse.json(normalize(setting?.value ?? defaults));
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data = normalize(body);

  await db.setting.upsert({
    where: { key: KEY },
    update: { value: data },
    create: { key: KEY, value: data },
  });

  return NextResponse.json(data);
}
