import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";
import { defaultFooterSettings, normalizeFooterSettings } from "@/lib/footer-config";

const KEY = "footer_settings_v1";

export async function GET(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "public",
    rateLimitKey: () => "footer-settings:get:public",
    rateLimitMax: 120,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const setting = await db.setting.findUnique({ where: { key: KEY } });
  return withRequestId(context.requestId, normalizeFooterSettings(setting?.value ?? defaultFooterSettings));
}
