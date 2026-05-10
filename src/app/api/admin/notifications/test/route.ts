import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { sendAdminPushNotification } from "@/lib/push";
import { sendDiscordNotification } from "@/lib/discord";

export async function POST() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "notifications.send")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await sendAdminPushNotification({
    title: "Admin test notification",
    message: `Triggered by ${session.user.name || session.user.id}`,
    type: "ADMIN_TEST",
    priority: "MEDIUM",
    entity: "system",
  });
  await sendDiscordNotification(
    `Admin test alert sent by ${session.user.name || session.user.id}`
  );

  return NextResponse.json({ ok: true });
}

