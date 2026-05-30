import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { notifyOrderStatusChanged } from "@/lib/discord";
import { sendAdminPushNotification, sendUserPushNotification } from "@/lib/push";

type PaymentAction = "verify" | "reject";

type PaymentActionActor = {
  id: string;
  name: string | null | undefined;
};

type PaymentActionInput = {
  orderId: string;
  action: PaymentAction;
  adminNote: string | null;
  actor: PaymentActionActor;
};

type PaymentActionResult = {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentId: string;
  paymentStatus: string;
  userId: string;
};

export class PaymentActionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const getActorName = (actor: PaymentActionActor): string => {
  return actor.name && actor.name.trim().length > 0 ? actor.name : "Admin";
};

const requirePendingPayment = (paymentStatus: string): void => {
  if (paymentStatus !== "PENDING_VERIFICATION") {
    throw new PaymentActionError(
      `Payment is already ${paymentStatus}. Only pending payments can be verified or rejected.`,
      409
    );
  }
};

const restoreOrderStock = async (
  tx: Prisma.TransactionClient,
  items: Array<{ variantId: string; quantity: number }>
): Promise<void> => {
  for (const item of items) {
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
  }
};

export async function applyPaymentAction(input: PaymentActionInput): Promise<PaymentActionResult> {
  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { payment: true, items: true },
    });

    if (!order) {
      throw new PaymentActionError(`Order ${input.orderId} was not found.`, 404);
    }

    if (!order.payment) {
      throw new PaymentActionError(`Order ${order.orderNumber} does not have a payment record.`, 404);
    }

    requirePendingPayment(order.payment.status);

    if (input.action === "verify") {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: {
          status: "VERIFIED",
          verifiedBy: input.actor.id,
          verifiedAt: new Date(),
          adminNote: input.adminNote,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" },
      });

      await tx.auditLog.create({
        data: {
          userId: input.actor.id,
          action: "PAYMENT_VERIFIED",
          entity: "ORDER",
          entityId: order.id,
          details: { paymentId: order.payment.id, adminNote: input.adminNote },
        },
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: "CONFIRMED",
        paymentId: order.payment.id,
        paymentStatus: "VERIFIED",
        userId: order.userId,
      };
    }

    await tx.payment.update({
      where: { id: order.payment.id },
      data: {
        status: "REJECTED",
        verifiedBy: input.actor.id,
        verifiedAt: new Date(),
        adminNote: input.adminNote,
      },
    });

    await restoreOrderStock(tx, order.items);

    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    await tx.auditLog.create({
      data: {
        userId: input.actor.id,
        action: "PAYMENT_REJECTED",
        entity: "ORDER",
        entityId: order.id,
        details: { paymentId: order.payment.id, adminNote: input.adminNote },
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: "CANCELLED",
      paymentId: order.payment.id,
      paymentStatus: "REJECTED",
      userId: order.userId,
    };
  });

  const actorName = getActorName(input.actor);
  notifyOrderStatusChanged({
    orderNumber: result.orderNumber,
    status: result.orderStatus,
    adminName: actorName,
  }).catch(console.error);

  sendAdminPushNotification({
    title: `Payment ${input.action === "verify" ? "verified" : "rejected"}: ${result.orderNumber}`,
    message:
      input.action === "verify"
        ? `Order moved to CONFIRMED by ${actorName}.`
        : `Order cancelled and stock restored by ${actorName}.`,
    type: input.action === "verify" ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED",
    priority: "HIGH",
    entity: "order",
    entityId: result.orderId,
  }).catch(console.error);

  sendUserPushNotification(result.userId, {
    title: `Payment ${input.action === "verify" ? "verified" : "rejected"}`,
    message:
      input.action === "verify"
        ? `Your order ${result.orderNumber} has been confirmed.`
        : `Your payment for ${result.orderNumber} was rejected. Check the order for details.`,
    type: input.action === "verify" ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED",
    priority: "HIGH",
    entity: "order",
    entityId: result.orderId,
  }).catch(console.error);

  return result;
}
