"use client";

import { useEffect, useRef } from "react";
import { message } from "antd";
import { Bell } from "lucide-react";
import { notificationService } from "../services/notification.service";
import { useNotificationStore } from "../stores/notification.store";

const POLL_INTERVAL_MS = 30000;

export default function NotificationWatcher() {
  const [api, contextHolder] = message.useMessage();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const lastSeenIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const checkNewNotifications = async () => {
      try {
        const data = await notificationService.getNotifications({
          page: 0,
          size: 5,
          unreadOnly: false,
        });
        const newCount = data.unreadCount;
        const latestId = data.items[0]?.id ?? null;

        // First run: only seed the state, do not show a toast
        if (!initializedRef.current) {
          initializedRef.current = true;
          lastSeenIdRef.current = latestId;
          if (newCount !== unreadCount) {
            setUnreadCount(newCount);
          }
          return;
        }

        // Update badge count if changed
        if (newCount !== unreadCount) {
          setUnreadCount(newCount);
        }

        // Show toast only when a brand-new notification id appears at the top
        if (latestId && latestId !== lastSeenIdRef.current) {
          const newest = data.items[0];
          if (newest && !newest.isRead) {
            api.open({
              type: "info",
              duration: 4,
              icon: <Bell className="w-5 h-5 text-blue-500" />,
              content: (
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-900 text-sm">
                    {newest.title}
                  </span>
                  <span className="text-xs text-slate-500 line-clamp-2">
                    {newest.body}
                  </span>
                </div>
              ),
              className: "cursor-pointer",
              onClick: () => {
                if (typeof window !== "undefined") {
                  window.location.href = "/customer/notifications";
                }
              },
            });
          }
          lastSeenIdRef.current = latestId;
        }
      } catch (err) {
        console.error("NotificationWatcher poll failed:", err);
      }
    };

    // Run immediately, then poll every POLL_INTERVAL_MS
    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [api, setUnreadCount, unreadCount]);

  return contextHolder;
}
