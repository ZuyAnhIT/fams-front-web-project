import type { Notification } from "../types/notification.type";

function metadataString(notification: Notification, key: string): string | null {
  const value = notification.metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

/** Maps structured notification metadata to an existing Web workflow. */
export function getNotificationHref(notification: Notification): string | null {
  const checkinId = metadataString(notification, "checkinId");
  if (checkinId) {
    return `/customer/attendance?tab=checkins&checkinId=${encodeURIComponent(checkinId)}`;
  }

  const checkId = metadataString(notification, "checkId")
    || metadataString(notification, "scheduledCheckId");
  if (checkId) {
    return `/customer/random-checks?checkId=${encodeURIComponent(checkId)}`;
  }

  const employeeId = metadataString(notification, "employeeId");
  if (employeeId) return `/customer/employees/${encodeURIComponent(employeeId)}`;

  const siteId = metadataString(notification, "siteId");
  if (siteId) return `/customer/sites/${encodeURIComponent(siteId)}`;

  return null;
}
