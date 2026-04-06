interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  thumbnail?: { url: string };
  url?: string;
  footer?: { text: string };
  timestamp?: string;
}

export async function sendDiscordNotification(
  content: string,
  embeds?: DiscordEmbed[]
) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("DISCORD_WEBHOOK_URL not set, skipping notification");
    return;
  }

  const body: Record<string, unknown> = { content };
  if (embeds) body.embeds = embeds;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function notifyPaymentSubmitted({
  orderNumber,
  customerName,
  customerPhone,
  method,
  amount,
  transactionId,
  screenshotUrl,
  orderId,
}: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  method: string;
  amount: number;
  transactionId?: string;
  screenshotUrl?: string;
  orderId: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const embed: DiscordEmbed = {
    title: `💰 New Payment — Order #${orderNumber}`,
    description: `A customer has submitted payment and is waiting for verification.`,
    color: 0xf59e0b, // amber
    fields: [
      { name: "Customer", value: customerName, inline: true },
      { name: "Phone", value: customerPhone, inline: true },
      { name: "Method", value: method.toUpperCase(), inline: true },
      { name: "Amount", value: `BDT ${(amount / 100).toLocaleString()}`, inline: true },
    ],
    url: `${siteUrl}/admin/orders/${orderId}`,
    footer: { text: "Click the title to verify this payment" },
    timestamp: new Date().toISOString(),
  };

  if (transactionId) {
    embed.fields!.push({ name: "Transaction ID", value: transactionId, inline: false });
  }

  if (screenshotUrl) {
    embed.thumbnail = { url: `${siteUrl}${screenshotUrl}` };
  }

  await sendDiscordNotification("🔔 **Payment Verification Needed**", [embed]);
}

export async function notifyOrderStatusChanged({
  orderNumber,
  status,
  adminName,
}: {
  orderNumber: string;
  status: string;
  adminName: string;
}) {
  const color =
    status === "CONFIRMED" ? 0x22c55e :
    status === "SHIPPED" ? 0x3b82f6 :
    status === "DELIVERED" ? 0x10b981 :
    status === "CANCELLED" ? 0xef4444 :
    0x6b7280;

  await sendDiscordNotification("", [
    {
      title: `📦 Order #${orderNumber} → ${status}`,
      color,
      fields: [
        { name: "Updated by", value: adminName, inline: true },
        { name: "New Status", value: status, inline: true },
      ],
      timestamp: new Date().toISOString(),
    },
  ]);
}
