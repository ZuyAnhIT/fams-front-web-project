"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  TrendingUp,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserPlus,
  Megaphone,
  FileText,
  ScanFace,
  BellOff,
} from "lucide-react";
import { NOTIFICATION_TYPE_LABELS, DEFAULT_NOTIFICATION_TYPE } from "../types/notification.type";
import { notificationService, NotificationResponse } from "../services/notification.service";
import { Empty, Segmented, Spin } from "antd";
import { message } from "antd";
import { notificationEventBus, useNotificationStore } from "../stores/notification.store";

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

interface NotificationCardProps {
  notification: NotificationResponse;
  onMarkAsRead: (id: string) => void;
  isMarking: boolean;
}

function NotificationCard({ notification, onMarkAsRead, isMarking }: NotificationCardProps) {
  const typeInfo = getTypeInfo(notification.eventType);
  const IconComponent = ICON_MAP[typeInfo.icon] || Bell;
  const colorClass = getColorClass(typeInfo.color);

  return (
    <div
      className={`relative rounded-xl border transition-all hover:shadow-md ${
        !notification.isRead
          ? "bg-white border-blue-200 shadow-sm"
          : "bg-slate-50/50 border-slate-200"
      }`}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />
      )}

      <div className="p-4 pl-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {!notification.isRead && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                      Mới
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}
                  >
                    {typeInfo.label}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-slate-900 mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-slate-600 mb-2">{notification.body}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                  {notification.readAt && (
                    <span className="flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                      Đã đọc: {formatTimeAgo(notification.readAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!notification.isRead && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    disabled={isMarking}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Đánh dấu đã đọc"
                  >
                    <Check className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type FilterType = "all" | "unread";

export default function NotificationPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  // Subscribe to notification store
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  const fetchNotifications = useCallback(async (page: number = 0, append: boolean = false) => {
    if (page === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    try {
      const data = await notificationService.getNotifications(page, PAGE_SIZE, filter === "unread");
      if (append) {
        setNotifications((prev) => [...prev, ...data.items]);
      } else {
        setNotifications(data.items);
      }
      setCurrentPage(page);
      setHasMore(!data.last);
      setUnreadCount(data.unreadCount);
    } catch (err: any) {
      setError(err.message || "Không thể tải thông báo");
      message.error("Không thể tải thông báo");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filter, setUnreadCount]);

  useEffect(() => {
    fetchNotifications(0);
  }, [fetchNotifications]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchNotifications(currentPage + 1, true);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      message.success("Đã đánh dấu đã đọc");
      // Emit event để NotificationBell cập nhật badge
      notificationEventBus.emit("mark-read");
    } catch (err) {
      message.error("Không thể đánh dấu đã đọc");
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      const count = await notificationService.markAllAsRead();
      await fetchNotifications();
      message.success("Đã đánh dấu tất cả đã đọc");
      // Emit event với số lượng đã đánh dấu
      for (let i = 0; i < count; i++) {
        notificationEventBus.emit("mark-read");
      }
    } catch (err) {
      message.error("Không thể đánh dấu tất cả đã đọc");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalCount = notifications.length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thông báo</h1>
            <p className="text-sm text-slate-500 mt-1">{unreadCount} thông báo chưa đọc</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <Segmented
            value={filter}
            onChange={(value) => setFilter(value as FilterType)}
            options={[
              {
                label: (
                  <div className="flex items-center gap-2 px-3">
                    <Bell className="w-4 h-4" />
                    <span>Tất cả</span>
                  </div>
                ),
                value: "all",
              },
              {
                label: (
                  <div className="flex items-center gap-2 px-3">
                    <span>Chưa đọc</span>
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                      {unreadCount}
                    </span>
                  </div>
                ),
                value: "unread",
              },
            ]}
            className="bg-slate-100"
          />

          <div className="text-sm text-slate-500">
            {isLoading ? "Đang tải..." : `Hiển thị ${notifications.length} thông báo`}
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex justify-center">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12">
            <Empty
              description={
                <div className="text-center">
                  <p className="text-red-500 font-medium mb-1">{error}</p>
                  <button
                    onClick={fetchNotifications}
                    className="text-blue-500 hover:underline"
                  >
                    Thử lại
                  </button>
                </div>
              }
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12">
            <Empty
              image={
                <div className="flex justify-center mb-4">
                  {filter === "unread" ? (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <CheckCheck className="w-8 h-8 text-slate-400" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <BellOff className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
              }
              description={
                filter === "unread" ? (
                  <div className="text-center">
                    <p className="text-slate-600 font-medium mb-1">
                      Tất cả thông báo đã được đọc
                    </p>
                    <p className="text-slate-400 text-sm">
                      Bạn không có thông báo nào chưa đọc
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-600 font-medium mb-1">
                      Chưa có thông báo nào
                    </p>
                    <p className="text-slate-400 text-sm">
                      Các thông báo sẽ xuất hiện ở đây khi có
                    </p>
                  </div>
                )
              }
            />
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                isMarking={markingId === notification.id}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? "Đang tải..." : "Xem thêm"}
                </button>
              </div>
            )}

            {/* Hiển thị số thông báo */}
            <div className="text-center text-sm text-slate-400 pt-2">
              {isLoadingMore ? "" : `Đã tải ${notifications.length} thông báo`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
