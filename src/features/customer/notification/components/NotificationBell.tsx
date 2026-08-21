"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Clock, AlertCircle, TrendingUp, MapPin, AlertTriangle, CheckCircle, XCircle, UserPlus, Megaphone, FileText, ScanFace } from "lucide-react";
import {
  NOTIFICATION_TYPE_LABELS,
  DEFAULT_NOTIFICATION_TYPE,
  type Notification,
} from "../types/notification.type";
import { notificationService } from "../services/notification.service";
import { App, Badge, Popover, Spin } from "antd";
import { useRouter } from "next/navigation";
import { useNotificationStore, notificationEventBus } from "../stores/notification.store";
import { getNotificationHref } from "../utils/notification.mapper";

// Icon mapping cho các loại notification
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock: Clock,
  Clock4: Clock,
  TrendingUp: TrendingUp,
  MapPin: MapPin,
  AlertCircle: AlertCircle,
  AlertTriangle: AlertTriangle,
  CheckCircle: CheckCircle,
  XCircle: XCircle,
  UserPlus: UserPlus,
  Megaphone: Megaphone,
  FileText: FileText,
  ScanFace: ScanFace,
  Bell: Bell,
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getTypeInfo(eventType: string) {
  return NOTIFICATION_TYPE_LABELS[eventType] || DEFAULT_NOTIFICATION_TYPE;
}

function getColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    gray: "bg-gray-100 text-gray-600",
  };
  return colorMap[color] || colorMap.gray;
}

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  isMarking: boolean;
}

function NotificationItem({ notification, onClick, isMarking }: NotificationItemProps) {
  const typeInfo = getTypeInfo(notification.eventType);
  const IconComponent = ICON_MAP[typeInfo.icon] || Bell;
  const colorClass = getColorClass(typeInfo.color);

  return (
    <button
      type="button"
      className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        !notification.isRead ? "bg-blue-50/50" : ""
      } ${isMarking ? "opacity-50" : ""}`}
      onClick={() => !isMarking && onClick(notification)}
      disabled={isMarking}
      aria-label={`${notification.isRead ? "Mở" : "Đánh dấu đã đọc và mở"}: ${notification.title}`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <IconComponent className="w-5 h-5" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate ${!notification.isRead ? "text-slate-900" : "text-slate-600"}`}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" />
            )}
            {(notification.priority === "critical" || notification.priority === "high") && (
              <span
                className={`flex-shrink-0 w-2 h-2 rounded-full ${
                  notification.priority === "critical" ? "bg-red-500" : "bg-amber-500"
                }`}
                title={notification.priority === "critical" ? "Khẩn cấp" : "Quan trọng"}
                aria-hidden="true"
              />
            )}
          </div>
          <span className="flex-shrink-0 text-xs text-slate-400 whitespace-nowrap">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-slate-400 mt-1">{typeInfo.label}</p>
      </div>
    </button>
  );
}

interface NotificationPopoverContentProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onViewAll: () => void;
  markingId: string | null;
  isMarkingAll: boolean;
  isLoading: boolean;
}

function NotificationPopoverContent({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll,
  markingId,
  isMarkingAll,
  isLoading,
}: NotificationPopoverContentProps) {
  return (
    <div className="flex max-h-[min(500px,70vh)] w-[min(380px,calc(100vw-24px))] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900">Thông báo</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
              {unreadCount} mới
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={isMarkingAll}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spin size="small" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Bell className="w-12 h-12 mb-3 opacity-30" aria-hidden="true" />
            <p className="text-sm">Không có thông báo nào</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.slice(0, 10).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={onMarkAsRead}
                isMarking={markingId === notification.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-4 py-3">
        <button
          type="button"
          onClick={onViewAll}
          className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Xem tất cả thông báo
        </button>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const router = useRouter();

  // Subscribe to notification store
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const notifications = useNotificationStore((state) => state.notifications);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const markNotificationAsRead = useNotificationStore((state) => state.markNotificationAsRead);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications({
        page: 0,
        size: 10,
        unreadOnly: false,
      });
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [setNotifications, setUnreadCount]);

  // When the bell is closed, still keep the list fresh by syncing with store updates
  // (NotificationWatcher in DashboardLayout polls and bumps unreadCount via the store).
  // We also poll on our own at a slower cadence so that list content (not just count) refreshes.
  useEffect(() => {
    // Poll when popover is closed to keep list ready for next open
    if (open) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [open, fetchNotifications]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      void fetchNotifications();
    }
  };

  // Initial fetch on mount and listen for external changes
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchNotifications();
    }, 0);

    // Listen to refresh events (e.g. fired by handleMarkAllAsRead) to keep list fresh
    const unsubscribe = notificationEventBus.subscribe("refresh", () => {
      fetchNotifications();
    });

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAsRead = async (notification: Notification) => {
    setMarkingId(notification.id);
    try {
      if (!notification.isRead) await notificationService.markAsRead(notification.id);
      // Update shared store so other components (NotificationPage) reflect the change
      if (!notification.isRead) markNotificationAsRead(notification.id);
      notificationEventBus.emit("refresh");
      setOpen(false);
      router.push(getNotificationHref(notification) || "/customer/notifications");
    } catch {
      message.error("Không thể đánh dấu đã đọc");
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      await fetchNotifications();
      notificationEventBus.emit("refresh");
      message.success("Đã đánh dấu tất cả đã đọc");
    } catch {
      message.error("Không thể đánh dấu tất cả đã đọc");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push("/customer/notifications");
  };

  const content = (
    <NotificationPopoverContent
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onViewAll={handleViewAll}
      markingId={markingId}
      isMarkingAll={isMarkingAll}
      isLoading={isLoading}
    />
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      overlayClassName="notification-popover"
      arrow={false}
    >
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Mở thông báo, có ${unreadCount} thông báo chưa đọc` : "Mở thông báo"}
        aria-expanded={open}
        className="relative cursor-pointer rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Bell className="h-5 w-5" aria-hidden="true" />
        </Badge>
      </button>
    </Popover>
  );
}
