import type { ViolationType } from '../types/violation.type';

export const VIOLATION_META: Record<ViolationType, { label: string; color: string }> = {
  no_response: { label: 'Không phản hồi', color: 'red' },
  location_fail: { label: 'Sai vị trí', color: 'orange' },
  face_fail: { label: 'Face ID không đạt', color: 'purple' },
  liveness_fail: { label: 'Liveness không đạt', color: 'magenta' },
};

export function getViolationErrorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { userMessage?: string; message?: string } } }).response?.data;
  return data?.userMessage || data?.message || fallback;
}
