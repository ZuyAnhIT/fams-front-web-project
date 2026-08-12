import type { ViolationType } from '../types/violation.type';

export const VIOLATION_META: Record<ViolationType, { label: string; color: string }> = {
  no_response: { label: 'Không phản hồi', color: 'red' },
  location_fail: { label: 'Sai vị trí', color: 'orange' },
  face_fail: { label: 'Face ID không đạt', color: 'purple' },
  liveness_fail: { label: 'Liveness không đạt', color: 'magenta' },
  // 2026-08-12: AI service không phản hồi kịp lúc xác thực — có thể do lỗi hạ tầng, không hẳn
  // nhân viên xác thực sai. Màu vàng (cảnh báo) để phân biệt trực quan với các lỗi xác thực thật
  // (tím/đỏ tươi) — HR nên xem lại kỹ trước khi confirm.
  face_verify_timeout: { label: 'AI xác thực quá hạn', color: 'gold' },
};

export function getViolationErrorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { userMessage?: string; message?: string } } }).response?.data;
  return data?.userMessage || data?.message || fallback;
}
