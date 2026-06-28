export const RESOURCE_MAP: Record<string, string> = {
  users: "Người dùng",
  employees: "Nhân viên",
  sites: "Địa điểm / Công trường",
  shifts: "Ca làm việc",
  assignments: "Phân công",
  checkins: "Chấm công",
  attendance: "Điểm danh",
  randomchecks: "Kiểm tra đột xuất",
  violations: "Vi phạm",
  reports: "Báo cáo",
  notifications: "Thông báo",
  audit: "Nhật ký hệ thống",
  tenants: "Công ty",
  plans: "Gói dịch vụ",
  roles: "Vai trò",
  permissions: "Quyền hệ thống",
  workspaces: "Không gian làm việc",
  workspace_members: "Thành viên trong không gian làm việc",
  geofences: "Vùng địa lý",
};

export const ACTION_MAP: Record<string, string> = {
  create: "Thêm mới",
  read: "Xem chi tiết",
  update: "Cập nhật",
  delete: "Xóa",
  list: "Xem danh sách",
  export: "Xuất dữ liệu",
  configure: "Cấu hình",
};

export const formatResource = (resource: string): string => {
  return RESOURCE_MAP[resource] || resource;
};

export const formatAction = (action: string): string => {
  return ACTION_MAP[action] || action;
};

export const formatDescription = (permission: { action: string; resource: string; description?: string }): string => {
  const actionText = formatAction(permission.action);
  const resourceText = formatResource(permission.resource).toLowerCase();

  // Custom overrides for specific actions
  if (permission.action === "create" && permission.resource === "checkins") {
    return "Thực hiện chấm công";
  }

  return `${actionText} ${resourceText}`;
};
