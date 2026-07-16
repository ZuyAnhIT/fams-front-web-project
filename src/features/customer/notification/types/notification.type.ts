export interface Notification {
  id: string;
  eventType: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPageResponse {
  items: Notification[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  unreadCount: number;
}

export interface NotificationFilter {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
}

export const NOTIFICATION_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  // Attendance
  "attendance.late_checkin": { label: "Chấm công trễ", icon: "Clock", color: "orange" },
  "attendance.missing_checkout": { label: "Thiếu giờ ra", icon: "Clock4", color: "orange" },
  "attendance.ot_detected": { label: "Tăng ca", icon: "TrendingUp", color: "blue" },
  // Random Check
  "randomcheck.dispatched": { label: "Kiểm tra vị trí", icon: "MapPin", color: "purple" },
  "randomcheck.no_response": { label: "Không phản hồi", icon: "AlertCircle", color: "red" },
  // Violation
  "violation.raised": { label: "Vi phạm mới", icon: "AlertTriangle", color: "red" },
  "violation.confirmed": { label: "Vi phạm xác nhận", icon: "CheckCircle", color: "red" },
  "violation.dismissed": { label: "Vi phạm hủy", icon: "XCircle", color: "green" },
  // Assignment
  "assignment.created": { label: "Phân công mới", icon: "UserPlus", color: "blue" },
  // System
  "system.announcement": { label: "Thông báo hệ thống", icon: "Megaphone", color: "gray" },
  "report.ready": { label: "Báo cáo sẵn sàng", icon: "FileText", color: "blue" },
  // Face ID
  "face_id.enrolled": { label: "Face ID đăng ký", icon: "ScanFace", color: "green" },
  "face_id.revoked": { label: "Face ID hủy", icon: "ScanFace", color: "orange" },
  // Appointment
  "appointment.created": { label: "Lịch hẹn mới", icon: "Clock", color: "blue" },
  "appointment.confirmed": { label: "Lịch hẹn xác nhận", icon: "CheckCircle", color: "green" },
  "appointment.cancelled": { label: "Lịch hẹn hủy", icon: "XCircle", color: "red" },
  "appointment.reminder": { label: "Nhắc lịch hẹn", icon: "Bell", color: "orange" },
  // Payment
  "payment.success": { label: "Thanh toán thành công", icon: "CheckCircle", color: "green" },
  "payment.failed": { label: "Thanh toán thất bại", icon: "XCircle", color: "red" },
  "payment.refund": { label: "Hoàn tiền", icon: "TrendingUp", color: "blue" },
};

export const DEFAULT_NOTIFICATION_TYPE = { label: "Thông báo", icon: "Bell", color: "gray" };
