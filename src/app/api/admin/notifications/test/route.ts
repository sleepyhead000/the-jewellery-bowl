import { NextRequest } from "next/server";
import { sendAdminPushNotification } from "@/lib/push";
import { sendDiscordNotification } from "@/lib/discord";
import { runSecurityChecks, withRequestId } from "@/lib/api-security";

export async function POST(req: NextRequest) {
  const { context, error } = await runSecurityChecks(req, {
    authMode: "staff",
    permission: "notifications.send",
    requireSameOriginForMutations: true,
    rateLimitKey: (_req, userId) => `admin:notifications:test:${userId ?? "anon"}`,
    rateLimitMax: 10,
    rateLimitWindowSeconds: 300,
  });
  if (error) return error;

  const actor = context.userId ?? "unknown";

  await sendAdminPushNotification({
    title: "Admin test notification",
    message: `Triggered by ${actor}`,
    type: "ADMIN_TEST",
    priority: "MEDIUM",
    entity: "system",
  });
  await sendDiscordNotification(`Admin test alert sent by ${actor}`);

  return withRequestId(context.requestId, { ok: true });
}
