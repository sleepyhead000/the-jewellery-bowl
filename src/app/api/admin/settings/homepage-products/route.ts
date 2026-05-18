import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";

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

export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:settings:homepage:get:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const setting = await db.setting.findUnique({ where: { key: KEY } });
  return withRequestId(context.requestId, normalize(setting?.value ?? defaults));
}

export async function PATCH(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:settings:homepage:patch:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const body = await req.json();
  const data = normalize(body);

  await db.setting.upsert({
    where: { key: KEY },
    update: { value: data },
    create: { key: KEY, value: data },
  });

  return withRequestId(context.requestId, data);
}
