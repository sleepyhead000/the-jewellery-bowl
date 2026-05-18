"use client";

import { useState } from "react";
import { adminApiFetch, mapAdminApiError } from "@/lib/admin-api-client";
import { useAdminCapabilities } from "@/hooks/use-admin-capabilities";

export default function AdminNotificationsPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const { can, loading: loadingCapabilities } = useAdminCapabilities();
  const canSend = can("notifications.send");

  const subscribe = async () => {
    if (!canSend) {
      setStatus("Insufficient permission for this action.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("Push notifications are not supported in this browser.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("Notification permission denied.");
      return;
    }

    const reg = await navigator.serviceWorker.register("/sw.js");
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setStatus("VAPID public key is not configured.");
      return;
    }

    const key = Uint8Array.from(atob(vapidKey.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });

    try {
      await adminApiFetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setStatus("Push subscription enabled.");
    } catch (error: unknown) {
      setStatus(mapAdminApiError(error));
    }
  };

  const sendTest = async () => {
    if (!canSend) {
      setStatus("Insufficient permission for this action.");
      return;
    }
    setLoading(true);
    try {
      await adminApiFetch("/api/admin/notifications/test", { method: "POST" });
      setStatus("Test notification sent.");
    } catch (error: unknown) {
      setStatus(mapAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Admin Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Enable web push and send test alerts.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 space-y-4">
        <button onClick={subscribe} disabled={!canSend || loadingCapabilities} className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-md text-sm font-semibold disabled:opacity-50">
          Enable Browser Push
        </button>
        <button onClick={sendTest} disabled={loading || !canSend || loadingCapabilities} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold sm:ml-3 disabled:opacity-50">
          {loading ? "Sending..." : "Send Test Notification"}
        </button>
        {status ? <p className="text-sm text-gray-700">{status}</p> : null}
      </div>
    </div>
  );
}
