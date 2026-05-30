import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";
import { contentPagesSettingKey, defaultContentPages, normalizeContentPages } from "@/lib/content-pages-config";

export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:settings:content-pages:get:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const setting = await db.setting.findUnique({ where: { key: contentPagesSettingKey } });
  return withRequestId(context.requestId, normalizeContentPages(setting?.value ?? defaultContentPages));
}

export async function PATCH(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:settings:content-pages:patch:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const settings = normalizeContentPages(await req.json());
  await db.setting.upsert({
    where: { key: contentPagesSettingKey },
    update: { value: settings },
    create: { key: contentPagesSettingKey, value: settings },
  });

  return withRequestId(context.requestId, settings);
}
