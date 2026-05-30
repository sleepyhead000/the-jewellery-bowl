import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";
import { defaultFooterSettings, normalizeFooterSettings } from "@/lib/footer-config";

const KEY = "footer_settings_v1";

export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:settings:footer:get:${userId ?? "anon"}`,
    rateLimitMax: 60,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const setting = await db.setting.findUnique({ where: { key: KEY } });
  return withRequestId(context.requestId, normalizeFooterSettings(setting?.value ?? defaultFooterSettings));
}

export async function PATCH(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "settings.manage",
    requireJsonBody: true,
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:settings:footer:patch:${userId ?? "anon"}`,
    rateLimitMax: 20,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const settings = normalizeFooterSettings(await req.json());
  await db.setting.upsert({
    where: { key: KEY },
    update: { value: settings },
    create: { key: KEY, value: settings },
  });

  return withRequestId(context.requestId, settings);
}
