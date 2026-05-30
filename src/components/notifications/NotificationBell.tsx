"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Badge, Button } from "@/components/ui";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data: Record<string, unknown> | null;
};

type NotificationBellProps = {
  href: string;
  compact: boolean;
};

type NotificationResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

const getNotificationHref = (notification: NotificationItem, fallbackHref: string): string => {
  const url = notification.data?.url;
  return typeof url === "string" && url.length > 0 ? url : fallbackHref;
};

const vibrateForUnread = (): void => {
  if ("vibrate" in navigator) {
    navigator.vibrate([80, 40, 80]);
  }
};

export default function NotificationBell({ href, compact }: NotificationBellProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [authorized, setAuthorized] = useState<boolean>(true);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previousUnreadRef = useRef<number>(0);

  const fetchNotifications = async (): Promise<void> => {
    const res = await fetch("/api/notifications?limit=8", { cache: "no-store" });
    if (res.status === 401) {
      setAuthorized(false);
      return;
    }
    if (!res.ok) return;

    const data = (await res.json()) as NotificationResponse;
    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
    setAuthorized(true);

    if (previousUnreadRef.current > 0 && data.unreadCount > previousUnreadRef.current) {
      vibrateForUnread();
    }
    previousUnreadRef.current = data.unreadCount || 0;
  };

  useEffect(() => {
    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchNotifications();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const markAllRead = async (): Promise<void> => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    previousUnreadRef.current = 0;
  };

  if (!authorized) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        className="relative transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className={compact ? "h-[19px] w-[19px] md:h-[22px] md:w-[22px]" : "h-5 w-5"} />
        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-9 z-50 w-[min(92vw,24rem)] border border-[var(--color-border)] bg-[var(--color-elevated)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">Notifications</h2>
              {unreadCount > 0 ? <p className="text-xs text-[var(--color-text-muted)]">{unreadCount} unread</p> : null}
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-bold uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">No notifications yet</div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={getNotificationHref(notification, href)}
                  onClick={() => setOpen(false)}
                  className="block border-b border-[var(--color-border)] px-4 py-3 hover:bg-[var(--color-surface)]"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-[var(--color-accent)]"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium">{notification.title}</p>
                      <p className="mt-0.5 line-clamp-2 break-words text-xs text-[var(--color-text-secondary)]">{notification.message}</p>
                      <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-[var(--color-border)] p-3">
            <Link href={href} onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">
                View All
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
