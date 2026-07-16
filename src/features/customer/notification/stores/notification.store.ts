import { create } from "zustand";

interface NotificationState {
  unreadCount: number;
  lastUpdated: number | null;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
  incrementUnreadCount: () => void;
  refresh: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
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

  refresh: () =>
    set((state) => ({
      lastUpdated: Date.now(),
    })),
}));

// Event emitter for cross-component communication
type NotificationEventType = "refresh" | "mark-read";
type EventCallback = () => void;

class NotificationEventBus {
  private listeners: Map<NotificationEventType, EventCallback[]> = new Map();

  subscribe(event: NotificationEventType, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
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
