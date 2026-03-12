import { db } from "@workspace/db";
import { notifications } from "@workspace/db/schema";
import { generateId } from "./id.js";

export type NotificationType =
  | "new_request"
  | "request_accepted"
  | "service_started"
  | "service_completed"
  | "invoice_generated"
  | "payment_confirmed"
  | "payout_confirmed";

interface NotificationPayload {
  recipientId: string;
  recipientRole: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedWorkOrderId?: string;
}

export async function createNotification(payload: NotificationPayload) {
  await db.insert(notifications).values({
    id: generateId(),
    ...payload,
    isRead: false,
  });
}

export async function notifyAll(payloads: NotificationPayload[]) {
  for (const p of payloads) {
    await createNotification(p);
  }
}
