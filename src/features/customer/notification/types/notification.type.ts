// ======= Domain Types (matches BE wire format) =======

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  eventType: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPageResponse {
  items: Notification[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  unreadCount: number;
}

export interface NotificationFilter {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
}

export interface NotificationSetting {
  id: string | null;
  userId: string;
  eventType: string;
  label: string | null;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  customized: boolean;
  updatedAt: string | null;
}

export interface NotificationEventType {
  eventType: string;
  label: string;
  description: string;
  defaultInAppEnabled: boolean;
  defaultPushEnabled: boolean;
}

export interface UpdateNotificationSettingPayload {
  inAppEnabled: boolean;
  pushEnabled: boolean;
}

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  eventType: string;
  locale: string;
  titleTemplate: string;
  bodyTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplatePage {
  content: NotificationTemplate[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface NotificationTemplatePayload {
  eventType: string;
  locale: string;
  titleTemplate: string;
  bodyTemplate: string;
}

export type UpdateNotificationTemplatePayload = Partial<NotificationTemplatePayload>;

// ======= Generic API wrapper =======

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ======= Display constants =======

export type NotificationTypeMeta = {
  label: string;
  icon: string;
  color: string;
};

export const NOTIFICATION_TYPE_LABELS: Record<string, NotificationTypeMeta> = {
  RANDOM_CHECK_SENT: { label: "Yêu cầu kiểm tra ngẫu nhiên", icon: "MapPin", color: "purple" },
};

export const DEFAULT_NOTIFICATION_TYPE: NotificationTypeMeta = {
  label: "Thông báo",
  icon: "Bell",
  color: "gray",
};
