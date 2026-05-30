"use client";

import { useState } from "react";
import { BellRing, Send } from "lucide-react";
import { Button } from "@/components/ui";
import { adminApiFetch, mapAdminApiError } from "@/lib/admin-api-client";

type PushNotificationControlProps = {
  allowTest: boolean;
};

type PushKeyResponse = {
  publicKey: string;
  configured: boolean;
};

const decodeVapidKey = (key: string): ArrayBuffer => {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = `${key}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return decoded.buffer.slice(decoded.byteOffset, decoded.byteOffset + decoded.byteLength) as ArrayBuffer;
};

const notifyVibration = (): void => {
  if ("vibrate" in navigator) {
    navigator.vibrate([120, 50, 120]);
  }
};

export default function PushNotificationControl({ allowTest }: PushNotificationControlProps) {
  const [status, setStatus] = useState<string>("");
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);

  const subscribe = async (): Promise<void> => {
    setSubscribing(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("Push notifications are not supported in this browser.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Notification permission denied.");
        return;
      }

      const keyResponse = await adminApiFetch<PushKeyResponse>("/api/push-subscriptions");
      if (!keyResponse.configured || !keyResponse.publicKey) {
        setStatus("VAPID public key is not configured.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(keyResponse.publicKey),
        }));

      await adminApiFetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      notifyVibration();
      setStatus("Push notifications enabled for this device.");
    } catch (error: unknown) {
      setStatus(mapAdminApiError(error));
    } finally {
      setSubscribing(false);
    }
  };

  const sendTest = async (): Promise<void> => {
    setTesting(true);
    try {
      await adminApiFetch("/api/admin/notifications/test", { method: "POST" });
      notifyVibration();
      setStatus("Test notification sent.");
    } catch (error: unknown) {
      setStatus(mapAdminApiError(error));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-elevated)] p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={subscribe} loading={subscribing} className="w-full gap-2 sm:w-auto">
          <BellRing className="h-4 w-4" /> Enable Device Alerts
        </Button>
        {allowTest ? (
          <Button onClick={sendTest} loading={testing} variant="outline" className="w-full gap-2 sm:w-auto">
            <Send className="h-4 w-4" /> Send Test
          </Button>
        ) : null}
      </div>
      {status ? <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{status}</p> : null}
    </div>
  );
}
