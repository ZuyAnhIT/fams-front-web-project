import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/stores/auth.store";

const getTenantId = () => {
  const state = useAuthStore.getState();
  if (state.user && state.user.tenantId) {
    return state.user.tenantId;
  }
  return null;
};

export interface NotificationResponse {
  id: string;
  tenantId: string;
  userId: string;
  eventType: string;
  title: string;
  body: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPageResponse {
  items: NotificationResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  unreadCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Mock data for demo
const MOCK_NOTIFICATIONS: NotificationResponse[] = [
  // Unread notifications
  {
    id: "demo-1",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "appointment.confirmed",
    title: "Lịch hẹn mới được xác nhận",
    body: "Bạn có lịch hẹn khám bệnh vào ngày 20/07/2026 lúc 09:00 với bác sĩ Nguyễn Văn A tại Phòng khám Đa khoa Tâm An.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-2",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "payment.success",
    title: "Thanh toán thành công",
    body: "Thanh toán viện phí lịch hẹn #12345 thành công. Số tiền: 350.000đ",
    isRead: true,
    readAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-3",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "attendance.late_checkin",
    title: "Bạn đã chấm công trễ hôm nay",
    body: "Bạn đã chấm công vào lúc 08:35 thay vì 08:00. Vui lòng liên hệ quản lý nếu có lý do hợp lệ.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-4",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "randomcheck.dispatched",
    title: "Yêu cầu kiểm tra vị trí",
    body: "Quản lý yêu cầu bạn xác nhận vị trí làm việc hiện tại. Vui lòng phản hồi trong 15 phút.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-5",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "appointment.reminder",
    title: "Nhắc nhở: Lịch hẹn ngày mai",
    body: "Bạn có lịch hẹn tái khám vào ngày 17/07/2026 lúc 14:00 tại Bệnh viện Quân y 175. Đừng quên mang theo giấy tờ tùy thân.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-6",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "assignment.created",
    title: "Bạn được phân công công việc mới",
    body: "Dự án 'Hệ thống Quản lý Nhân sự' đã được giao cho bạn. Deadline: 25/07/2026.",
    isRead: true,
    readAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-7",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "violation.raised",
    title: "Cảnh báo vi phạm mới",
    body: "Bạn đã không hoàn thành báo cáo công việc trong 3 ngày liên tiếp. Vui lòng cập nhật trạng thái.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-8",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "face_id.enrolled",
    title: "Face ID đã được đăng ký thành công",
    body: "Bạn có thể sử dụng nhận diện khuôn mặt để đăng nhập từ ngày 15/07/2026.",
    isRead: true,
    readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-9",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "report.ready",
    title: "Báo cáo tháng 06/2026 đã sẵn sàng",
    body: "Báo cáo chấm công và KPI tháng 6 đã được tạo. Bạn có thể xem chi tiết trong mục Báo cáo.",
    isRead: true,
    readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-10",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "payment.refund",
    title: "Hoàn tiền thành công",
    body: "Số tiền 150.000đ đã được hoàn vào tài khoản ngân hàng VietinBank ****4521. Thời gian xử lý: 24-48h.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-11",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "system.announcement",
    title: "Thông báo bảo trì hệ thống",
    body: "Hệ thống sẽ được bảo trì vào ngày 20/07/2026 từ 02:00 - 04:00. Vui lòng lưu công việc trước thời gian này.",
    isRead: true,
    readAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-12",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "appointment.cancelled",
    title: "Lịch hẹn bị hủy",
    body: "Lịch hẹn #67890 ngày 18/07/2026 đã bị hủy do bác sĩ bận. Vui lòng đặt lịch hẹn khác.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  // Additional mock notifications for pagination testing
  {
    id: "demo-13",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "task.completed",
    title: "Công việc đã hoàn thành",
    body: "Nhiệm vụ 'Soạn báo cáo tuần' đã được đánh dấu hoàn thành.",
    isRead: true,
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-14",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "leave.approved",
    title: "Đơn nghỉ phép được duyệt",
    body: "Đơn nghỉ phép ngày 22/07/2026 của bạn đã được phê duyệt.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-15",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "document.expiring",
    title: "Cảnh báo: Hộ chiếu sắp hết hạn",
    body: "Hộ chiếu của bạn sẽ hết hạn trong 30 ngày. Vui lòng gia hạn kịp thời.",
    isRead: true,
    readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-16",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "overtime.submitted",
    title: "Đăng ký làm thêm giờ",
    body: "Bạn đã đăng ký làm thêm 2 giờ vào ngày 18/07/2026. Đang chờ phê duyệt.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-17",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "insurance.claim",
    title: "Yêu cầu bảo hiểm đã xử lý",
    body: "Phiếu khám bệnh #INS-2026-789 đã được thanh toán bảo hiểm. Số tiền: 250.000đ",
    isRead: true,
    readAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-18",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "shift.reminder",
    title: "Nhắc nhở ca làm việc",
    body: "Ca làm việc sáng ngày 17/07/2026 bắt đầu lúc 08:00. Đừng quên check-in.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-19",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "contract.renewal",
    title: "Hợp đồng sắp hết hạn",
    body: "Hợp đồng lao động của bạn sẽ hết hạn trong 15 ngày. Liên hệ HR để gia hạn.",
    isRead: true,
    readAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-20",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "training.new",
    title: "Khóa đào tạo mới",
    body: "Khóa đào tạo 'Kỹ năng giao tiếp nâng cao' đã được mở đăng ký. Hạn đăng ký: 25/07/2026.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-21",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "payroll.processed",
    title: "Phiếu lương tháng 06/2026",
    body: "Phiếu lương tháng 6 đã được xử lý. Lương thực nhận: 15.500.000đ",
    isRead: true,
    readAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-22",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "device.return",
    title: "Yêu cầu trả thiết bị",
    body: "Vui lòng trả laptop Dell Latitude 5520 đã mượn trước ngày 20/07/2026.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-23",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "meeting.scheduled",
    title: "Cuộc họp mới được lên lịch",
    body: "Cuộc họp 'Review dự án Q2' vào ngày 18/07/2026 lúc 14:00. Tham gia tại Phòng họp A3.",
    isRead: true,
    readAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-24",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "approval.pending",
    title: "Cần phê duyệt đơn từ",
    body: "Bạn có 2 đơn từ cần phê duyệt từ nhân viên cấp dưới.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-25",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "performance.review",
    title: "Đánh giá hiệu suất quý 2",
    body: "Đánh giá hiệu suất làm việc Q2/2026 của bạn đã hoàn thành. Điểm: 85/100.",
    isRead: true,
    readAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-26",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "password.expiry",
    title: "Cảnh báo: Mật khẩu sắp hết hạn",
    body: "Mật khẩu của bạn sẽ hết hạn trong 5 ngày. Vui lòng đổi mật khẩu.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-27",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "tax.completed",
    title: "Quyết toán thuế hoàn thành",
    body: "Quyết toán thuế TNCN năm 2025 của bạn đã được xử lý thành công.",
    isRead: true,
    readAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-28",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "bonus.awarded",
    title: "Thưởng hiệu suất tháng 06",
    body: "Bạn được thưởng 2.000.000đ vì đạt KPI xuất sắc tháng 6.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-29",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "asset.assigned",
    title: "Thiết bị mới được cấp phát",
    body: "Bạn đã được cấp thẻ RFID số RF-2026-456. Vui lòng nhận tại phòng IT.",
    isRead: true,
    readAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-30",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "survey.request",
    title: "Khảo sát ý kiến nhân viên",
    body: "Vui lòng dành 5 phút tham gia khảo sát 'Môi trường làm việc Q2/2026'.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-31",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "policy.update",
    title: "Cập nhật chính sách công ty",
    body: "Chính sách 'Làm việc từ xa' đã được cập nhật. Có hiệu lực từ 01/08/2026.",
    isRead: true,
    readAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-32",
    tenantId: "tenant-1",
    userId: "user-1",
    eventType: "travel.request",
    title: "Yêu cầu công tác được duyệt",
    body: "Yêu cầu đi công tác Hà Nội ngày 22-23/07/2026 đã được duyệt.",
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

const USE_MOCK = true; // Toggle this to switch between mock and real API

export const notificationService = {
  getNotifications: async (
    page: number = 0,
    size: number = 20,
    unreadOnly: boolean = false
  ): Promise<NotificationPageResponse> => {
    if (USE_MOCK) {
      const filtered = unreadOnly
        ? MOCK_NOTIFICATIONS.filter((n) => !n.isRead)
        : MOCK_NOTIFICATIONS;

      // Sort by createdAt descending (newest first)
      const sorted = [...filtered].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Pagination
      const start = page * size;
      const end = start + size;
      const items = sorted.slice(start, end);
      const totalElements = sorted.length;
      const totalPages = Math.ceil(totalElements / size);

      return {
        items,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
        unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length,
      };
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error("Tenant ID not found");
    }

    const response = await apiClient.get<ApiResponse<NotificationPageResponse>>(
      `/tenants/${tenantId}/notifications`,
      {
        params: { page, size, unreadOnly },
      }
    );

    return response.data.data;
  },

  markAsRead: async (notificationId: string): Promise<NotificationResponse> => {
    if (USE_MOCK) {
      const notification = MOCK_NOTIFICATIONS.find((n) => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
        return notification;
      }
      throw new Error("Notification not found");
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error("Tenant ID not found");
    }

    const response = await apiClient.patch<ApiResponse<NotificationResponse>>(
      `/tenants/${tenantId}/notifications/${notificationId}/read`
    );

    return response.data.data;
  },

  markAllAsRead: async (): Promise<number> => {
    if (USE_MOCK) {
      const count = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;
      MOCK_NOTIFICATIONS.forEach((n) => {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      });
      return count;
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error("Tenant ID not found");
    }

    const response = await apiClient.patch<ApiResponse<{ count: number }>>(
      `/tenants/${tenantId}/notifications/read-all`
    );

    return response.data.data.count;
  },
};
