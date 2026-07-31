import { create } from "zustand";
import type { Notification } from "../types/notification.type";

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
  lastUpdated: number | null;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
  incrementUnreadCount: () => void;
  setNotifications: (items: Notification[]) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  reset: () => void;
  refresh: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],
  lastUpdated: null,

  setUnreadCount: (count: number) =>
    set({
      unreadCount: count,
      lastUpdated: Date.now(),
    }),

  decrementUnreadCount: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
      lastUpdated: Date.now(),
    })),

  incrementUnreadCount: () =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
      lastUpdated: Date.now(),
    })),

  setNotifications: (items: Notification[]) =>
    set({
      notifications: items,
      lastUpdated: Date.now(),
    }),

  markNotificationAsRead: (id: string) =>
    set((state) => {
      let changed = false;
      const next = state.notifications.map((n) => {
        if (n.id === id && !n.isRead) {
          changed = true;
          return { ...n, isRead: true, readAt: new Date().toISOString() };
        }
        return n;
      });
      return {
        notifications: changed ? next : state.notifications,
        unreadCount: changed ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        lastUpdated: Date.now(),
      };
    }),

  markAllNotificationsAsRead: () =>
    set((state) => {
      let changed = false;
      const next = state.notifications.map((n) => {
        if (!n.isRead) {
          changed = true;
          return { ...n, isRead: true, readAt: new Date().toISOString() };
        }
        return n;
      });
      return {
        notifications: changed ? next : state.notifications,
        unreadCount: 0,
        lastUpdated: Date.now(),
      };
    }),

  reset: () =>
    set({
      unreadCount: 0,
      notifications: [],
      lastUpdated: null,
    }),

  refresh: () => set({ lastUpdated: Date.now() }),
}));

// Event emitter for cross-component communication (e.g. trigger re-fetch on remote changes)
type NotificationEventType = "refresh" | "mark-read";
type EventCallback = () => void;

class NotificationEventBus {
  private listeners: Map<NotificationEventType, EventCallback[]> = new Map();

  subscribe(event: NotificationEventType, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  emit(event: NotificationEventType) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => callback());
  }
}

export const notificationEventBus = new NotificationEventBus();
