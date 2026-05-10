import webpush, { PushSubscription } from "web-push";
import { db } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@tnluxury.local";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendAdminPushNotification(input: {
  title: string;
  message: string;
  type: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  entity?: string;
  entityId?: string;
}) {
  const admins = await db.user.findMany({
    where: { role: { in: ["STAFF", "MANAGER", "ADMIN"] } },
    select: { id: true },
  });
  const adminIds = admins.map((u) => u.id);
  if (!adminIds.length) return;

  await db.notification.createMany({
    data: adminIds.map((id) => ({
      userId: id,
      title: input.title,
      message: input.message,
      type: input.type,
      channel: "PUSH",
      data: {
        type: input.type,
        priority: input.priority || "MEDIUM",
        entity: input.entity || null,
        entityId: input.entityId || null,
      },
    })),
  });

  if (!publicKey || !privateKey) {
    await sendDiscordNotification(
      `Push skipped (VAPID not configured): ${input.title}\n${input.message}`
    );
    return;
  }

  const subs = await db.pushSubscription.findMany({
    where: { userId: { in: adminIds } },
  });

  const payload = JSON.stringify({
    title: input.title,
    body: input.message,
    data: {
      type: input.type,
      priority: input.priority || "MEDIUM",
      entity: input.entity || null,
      entityId: input.entityId || null,
    },
  });

  for (const sub of subs) {
    const keys = sub.keys as { p256dh: string; auth: string };
    const pushSub: PushSubscription = { endpoint: sub.endpoint, keys };
    try {
      await webpush.sendNotification(pushSub, payload);
    } catch {
      await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null);
    }
  }
}

