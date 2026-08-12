import { Alert } from 'antd';

export function formatMinutes(value = 0) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (!hours) return `${minutes} phút`;
  return `${hours} giờ${minutes ? ` ${minutes} phút` : ''}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function reportErrorMessage(error: unknown) {
  const response = (error as {
    response?: { status?: number; data?: { message?: string; userMessage?: string } };
  }).response;
  if (response?.status === 403) return 'Bạn không có quyền xem công trình này hoặc báo cáo này.';
  return response?.data?.userMessage || response?.data?.message || 'Vui lòng thử lại.';
}

export function ReportError({ error, title = 'Không thể tải báo cáo' }: { error: unknown; title?: string }) {
  return <Alert type="error" showIcon title={title} description={reportErrorMessage(error)} />;
}

export const VIOLATION_LABELS = {
  no_response: 'Không phản hồi',
  location_fail: 'Sai vị trí',
  face_fail: 'Face ID không đạt',
  liveness_fail: 'Liveness không đạt',
  face_verify_timeout: 'AI xác thực quá hạn',
} as const;

export const SEVERITY_LABELS = {
  HIGH: 'Cao · xác thực danh tính',
  MEDIUM: 'Trung bình · vị trí',
  LOW: 'Thấp · không phản hồi',
} as const;
