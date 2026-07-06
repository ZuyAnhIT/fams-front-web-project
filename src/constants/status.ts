export interface StatusDotConfig {
  dot: string;
  text: string;
  label: string;
}

export interface StatusTagConfig {
  color: string;
  text: string;
}

export const TENANT_STATUS: Record<string, StatusDotConfig> = {
  active: { dot: "bg-emerald-500", text: "text-slate-700", label: "Hoạt động" },
  inactive: { dot: "bg-amber-500", text: "text-slate-700", label: "Tạm dừng" },
  suspended: { dot: "bg-rose-500", text: "text-slate-500 line-through", label: "Đình chỉ" },
  trial: { dot: "bg-blue-500", text: "text-blue-700", label: "Dùng thử" },
};

export const EMPLOYEE_STATUS: Record<string, StatusDotConfig> = {
  active: { dot: "bg-emerald-500", text: "text-slate-700", label: "Hoạt động" },
  inactive: { dot: "bg-amber-500", text: "text-slate-700", label: "Tạm nghỉ" },
  terminated: { dot: "bg-rose-500", text: "text-slate-500 line-through", label: "Đã nghỉ" },
};

export const INVITATION_STATUS: Record<string, StatusTagConfig> = {
  pending: { color: "blue", text: "Chờ xác nhận" },
  accepted: { color: "green", text: "Đã chấp nhận" },
  cancelled: { color: "red", text: "Đã hủy" },
  expired: { color: "default", text: "Hết hạn" },
};
