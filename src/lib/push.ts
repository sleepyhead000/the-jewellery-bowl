import webpush, { PushSubscription } from "web-push";
import { db } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@tnluxury.local";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

type PushNotificationInput = {
  title: string;
  message: string;
  type: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  entity?: string;
  entityId?: string;
  url: string;
};

const sendPushToUsers = async (userIds: string[], input: PushNotificationInput): Promise<void> => {
  const uniqueUserIds = Array.from(new Set(userIds));
  if (!uniqueUserIds.length) return;

  await db.notification.createMany({
    data: uniqueUserIds.map((id) => ({
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
        url: input.url,
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
    where: { userId: { in: uniqueUserIds } },
  });

  const payload = JSON.stringify({
    title: input.title,
    body: input.message,
    vibrate: input.priority === "LOW" ? [120] : [180, 80, 180],
    tag: input.entityId || input.type,
    data: {
      type: input.type,
      priority: input.priority || "MEDIUM",
      entity: input.entity || null,
      entityId: input.entityId || null,
      url: input.url,
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
};

export async function sendAdminPushNotification(input: Omit<PushNotificationInput, "url"> & { url?: string }) {
  const admins = await db.user.findMany({
    where: { role: { in: ["STAFF", "MANAGER", "ADMIN"] } },
    select: { id: true },
  });
  const adminIds = admins.map((u) => u.id);
  const url =
    input.url ??
    (input.entity === "order" && input.entityId ? `/admin/orders/${input.entityId}` : "/admin/notifications");

  await sendPushToUsers(adminIds, { ...input, url });
}

export async function sendUserPushNotification(
  userId: string,
  input: Omit<PushNotificationInput, "url"> & { url?: string }
) {
  const url =
    input.url ??
    (input.entity === "order" && input.entityId ? `/account/orders/${input.entityId}` : "/account/notifications");

  await sendPushToUsers([userId], { ...input, url });
}
