import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notification.service";
import type {
  NotificationTemplatePayload,
  UpdateNotificationSettingPayload,
  UpdateNotificationTemplatePayload,
} from "../types/notification.type";

export const notificationSettingKeys = {
  all: ["notification-settings"] as const,
};

export const notificationTemplateKeys = {
  all: ["notification-templates"] as const,
  list: (tenantId: string, page: number, size: number) => ["notification-templates", tenantId, page, size] as const,
};

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationSettingKeys.all,
    queryFn: () => notificationService.getSettings(),
  });
}

export function useUpdateNotificationSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventType, payload }: { eventType: string; payload: UpdateNotificationSettingPayload }) =>
      notificationService.updateSetting(eventType, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationSettingKeys.all }),
  });
}

export function useNotificationEventTypes() {
  return useQuery({
    queryKey: ["notification-event-types"],
    queryFn: () => notificationService.getEventTypes(),
  });
}

export function useNotificationTemplates(tenantId: string, page: number, size: number) {
  return useQuery({
    queryKey: notificationTemplateKeys.list(tenantId, page, size),
    queryFn: () => notificationService.getTemplates(tenantId, page, size),
    enabled: Boolean(tenantId),
  });
}

export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, payload }: { tenantId: string; payload: NotificationTemplatePayload }) =>
      notificationService.createTemplate(tenantId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationTemplateKeys.all }),
  });
}

export function useUpdateNotificationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, templateId, payload }: { tenantId: string; templateId: string; payload: UpdateNotificationTemplatePayload }) =>
      notificationService.updateTemplate(tenantId, templateId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationTemplateKeys.all }),
  });
}

export function useDeleteNotificationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, templateId }: { tenantId: string; templateId: string }) =>
      notificationService.deleteTemplate(tenantId, templateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationTemplateKeys.all }),
  });
}
