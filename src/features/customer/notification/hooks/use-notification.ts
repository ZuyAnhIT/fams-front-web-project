import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notification.service";
import type { UpdateNotificationSettingPayload } from "../types/notification.type";

export const notificationSettingKeys = {
  all: ["notification-settings"] as const,
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
