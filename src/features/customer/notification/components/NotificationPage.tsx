"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  ExternalLink,
} from "lucide-react";
import {
  NOTIFICATION_TYPE_LABELS,
  DEFAULT_NOTIFICATION_TYPE,
  type Notification,
} from "../types/notification.type";
import { notificationService } from "../services/notification.service";
import { App, Checkbox, Empty, Segmented, Spin } from "antd";
import { notificationEventBus, useNotificationStore } from "../stores/notification.store";
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

// #89 (2026-08-17): priority is now a real backend-decided field (see NotificationEventTypeCatalog
// defaultPriorityFor) — only surfaced for high/critical to avoid cluttering every card, since
// normal/low is the common case and doesn't need a badge.
const PRIORITY_LABEL: Record<string, string> = {
  critical: "Khẩn cấp",
  high: "Quan trọng",
};
const PRIORITY_BADGE_CLASS: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-amber-500 text-white",
};

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onOpen: (notification: Notification) => void;
  selected: boolean;
  onSelectedChange: (id: string, selected: boolean) => void;
  isMarking: boolean;
}

function NotificationCard({ notification, onMarkAsRead, onOpen, selected, onSelectedChange, isMarking }: NotificationCardProps) {
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
          <Checkbox
            aria-label={`Chọn thông báo ${notification.title}`}
            checked={selected}
            disabled={notification.isRead || isMarking}
            onChange={(event) => onSelectedChange(notification.id, event.target.checked)}
          />
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
                  {PRIORITY_LABEL[notification.priority] && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE_CLASS[notification.priority]}`}
                    >
                      {PRIORITY_LABEL[notification.priority]}
                    </span>
                  )}
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
                {getNotificationHref(notification) && (
                  <button
                    type="button"
                    onClick={() => onOpen(notification)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Mở nội dung liên quan <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
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
  const router = useRouter();
  const { message } = App.useApp();
  const [filter, setFilter] = useState<FilterType>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isMarkingSelected, setIsMarkingSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  // Subscribe to notification store
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  // Merge items by id, keeping the freshest createdAt first (newest → oldest)
  const mergeByIdDesc = (existing: Notification[], incoming: Notification[]) => {
    const map = new Map<string, Notification>();
    for (const n of existing) map.set(n.id, n);
    for (const n of incoming) map.set(n.id, n);
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // 1) Load the first page (full-screen spinner). Used for initial mount & filter change.
  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications({
        page: 0,
        size: PAGE_SIZE,
        unreadOnly: filter === "unread",
      });
      setNotifications(data.items);
      setSelectedIds(new Set());
      setCurrentPage(0);
      setHasMore(!data.last);
      setUnreadCount(data.unreadCount);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Không thể tải thông báo");
      message.error("Không thể tải thông báo");
    } finally {
      setIsLoading(false);
    }
  }, [filter, message, setUnreadCount]);

  // 2) Load more (next page). Appends to the end of the list.
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = await notificationService.getNotifications({
        page: nextPage,
        size: PAGE_SIZE,
        unreadOnly: filter === "unread",
      });
      setNotifications((prev) =>
        mergeByIdDesc(prev, data.items)
      );
      setCurrentPage(nextPage);
      setHasMore(!data.last);
      setUnreadCount(data.unreadCount);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Không thể tải thêm");
      message.error("Không thể tải thêm thông báo");
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, filter, message, setUnreadCount]);

  // 3) Silent refresh: only merge NEW items (createdAt newer than current top).
  //    Does NOT reset currentPage or replace existing items.
  const pollNewer = useCallback(async () => {
    if (isLoading || isLoadingMore) return;
    setIsRefreshing(true);
    try {
      const data = await notificationService.getNotifications({
        page: 0,
        size: PAGE_SIZE,
        unreadOnly: filter === "unread",
      });
      setNotifications((prev) => mergeByIdDesc(prev, data.items));
      setUnreadCount(data.unreadCount);
      // Don't touch currentPage or hasMore — the list may have grown organically.
    } catch (error: unknown) {
      // silent: do not toast for poll errors
      console.warn("Silent refresh failed", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [filter, isLoading, isLoadingMore, setUnreadCount]);

  // Initial load + reload when filter changes
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadFirstPage();
    }, 0);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Poll for new notifications every 30 seconds (merge-only, no spinner, no reset)
  useEffect(() => {
    const interval = setInterval(() => {
      pollNewer();
    }, 30000);

    return () => clearInterval(interval);
  }, [pollNewer]);

  // Listen for refresh events from other components (e.g. NotificationBell mark-as-read).
  // Use pollNewer (merge) instead of loadFirstPage (reset) to preserve loaded pages.
  useEffect(() => {
    const unsubscribe = notificationEventBus.subscribe("refresh", () => {
      pollNewer();
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    loadMore();
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
      notificationEventBus.emit("refresh");
    } catch {
      message.error("Không thể đánh dấu đã đọc");
    } finally {
      setMarkingId(null);
    }
  };

  const handleOpenNotification = async (notification: Notification) => {
    const href = getNotificationHref(notification);
    if (!href) return;
    if (!notification.isRead) await handleMarkAsRead(notification.id);
    router.push(href);
  };

  const handleSelectedChange = (id: string, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const unreadIdsOnPage = notifications.filter((item) => !item.isRead).map((item) => item.id);
  const allUnreadOnPageSelected = unreadIdsOnPage.length > 0
    && unreadIdsOnPage.every((id) => selectedIds.has(id));

  const handleSelectAllOnPage = (selected: boolean) => {
    setSelectedIds(selected ? new Set(unreadIdsOnPage) : new Set());
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;
    setIsMarkingSelected(true);
    try {
      const markedCount = await notificationService.markBatchAsRead(Array.from(selectedIds));
      await loadFirstPage();
      notificationEventBus.emit("refresh");
      message.success(`Đã đánh dấu ${markedCount} thông báo là đã đọc`);
    } catch {
      message.error("Không thể đánh dấu nhóm thông báo đã chọn");
    } finally {
      setIsMarkingSelected(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      await loadFirstPage();
      message.success("Đã đánh dấu tất cả đã đọc");
      notificationEventBus.emit("refresh");
    } catch {
      message.error("Không thể đánh dấu tất cả đã đọc");
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Thông báo</h1>
              <p className="text-sm text-slate-500 mt-1">{unreadCount} thông báo chưa đọc</p>
            </div>
            {isRefreshing && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Đang cập nhật...</span>
              </div>
            )}
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
        <div className="flex flex-wrap items-center justify-between gap-4">
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
        {!isLoading && unreadIdsOnPage.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <Checkbox
              checked={allUnreadOnPageSelected}
              indeterminate={selectedIds.size > 0 && !allUnreadOnPageSelected}
              onChange={(event) => handleSelectAllOnPage(event.target.checked)}
            >
              Chọn tất cả chưa đọc trên trang
            </Checkbox>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleMarkSelectedAsRead}
                disabled={isMarkingSelected}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />
                Đánh dấu đã đọc ({selectedIds.size})
              </button>
            )}
          </div>
        )}
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
                    onClick={loadFirstPage}
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
                onOpen={handleOpenNotification}
                selected={selectedIds.has(notification.id)}
                onSelectedChange={handleSelectedChange}
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
