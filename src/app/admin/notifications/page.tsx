"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import PushNotificationControl from "@/components/notifications/PushNotificationControl";
import { useAdminCapabilities } from "@/hooks/use-admin-capabilities";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data: Record<string, unknown>;
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { can } = useAdminCapabilities();
  const canSend = can("notifications.send");

  const fetchNotifications = async (): Promise<void> => {
    const res = await fetch("/api/notifications?limit=50");
    const data = await res.json();
    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async (): Promise<void> => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string): Promise<void> => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((items) => items.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading notifications...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">Review alerts and enable mobile push for this device.</p>
      </div>

      <PushNotificationControl allowTest={canSend} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">Recent Alerts</h2>
          {unreadCount > 0 ? <Badge variant="warning">{unreadCount} unread</Badge> : null}
        </div>
        {unreadCount > 0 ? (
          <Button size="sm" variant="outline" onClick={markAllRead} className="w-full gap-2 sm:w-auto">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="border border-gray-200 bg-white py-16 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 border p-4 transition-colors ${
                notification.isRead ? "border-gray-100 bg-white" : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-amber-500"}`} />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium">{notification.title}</p>
                <p className="mt-0.5 break-words text-sm text-gray-500">{notification.message}</p>
                <p className="mt-1 text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
              </div>
              {!notification.isRead ? (
                <button onClick={() => markRead(notification.id)} className="shrink-0 p-1.5 text-gray-400 hover:text-black" title="Mark read" type="button">
                  <Check className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
