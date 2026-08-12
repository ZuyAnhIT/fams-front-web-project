'use client';

import { useState } from 'react';
import { Alert, App, Card, Empty, Tag, Upload } from 'antd';
import dayjs from 'dayjs';
import { AlertTriangle, MapPin, MessageSquareText, Paperclip, Trash2 } from 'lucide-react';
import { BaseButton, BaseModal, BaseTextArea } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';

import { useExplainException, useMyExceptions } from '../hooks/use-violation';
import type { MyExceptionItem } from '../types/violation.type';
import { getViolationErrorMessage } from '../utils/violation.mapper';

const reasonLabels: Record<string, string> = {
  pending_review: 'Chấm công chờ duyệt',
  no_response: 'Không phản hồi kiểm tra',
  location_fail: 'Vị trí không đạt',
  face_fail: 'Face ID không đạt',
  liveness_fail: 'Liveness không đạt',
  face_verify_timeout: 'AI xác thực quá hạn',
};

export default function MyExceptionsPage() {
  const { message } = App.useApp();
  const tenantId = useAuthStore((state) => state.user?.tenantId || '');
  const query = useMyExceptions(tenantId);
  const explain = useExplainException();
  const [selected, setSelected] = useState<MyExceptionItem | null>(null);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const submit = async () => {
    if (!selected || !note.trim()) return;
    try {
      await explain.mutateAsync({ tenantId, item: selected, payload: { note: note.trim(), photo: photo || undefined } });
      message.success('Đã gửi giải trình cho quản lý.');
      setSelected(null);
      setNote('');
      setPhoto(null);
    } catch (error) {
      message.error(getViolationErrorMessage(error, 'Không thể gửi giải trình.'));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl"><MessageSquareText className="h-7 w-7 text-blue-600" />Cần tôi giải thích</h1>
        <p className="mt-1 text-sm text-slate-500">Một hộp thư chung cho chấm công chờ duyệt và vi phạm chưa được HR xử lý.</p>
      </div>
      <Alert type="info" showIcon title="Giải trình không tự thay đổi kết quả" description="Thông tin bạn gửi là bằng chứng bổ sung để HR đối chiếu. Mục vẫn có thể còn trong danh sách cho tới khi HR xử lý xong." />
      {query.isError && <Alert type="error" showIcon title="Không thể tải hộp thư" description={getViolationErrorMessage(query.error, 'Kiểm tra công ty đang chọn và thử lại.')} />}
      <Card loading={query.isLoading}>
        {(query.data?.data || []).length === 0 ? (
          <Empty description="Không có mục cần giải thích" />
        ) : (
          <div className="divide-y divide-slate-100">
            {(query.data?.data || []).map((item) => {
            const violation = item.sourceType === 'violation';
            const Icon = violation ? AlertTriangle : MapPin;
            return (
              <div key={`${item.sourceType}:${item.id}`} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${violation ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-800"><span>{reasonLabels[item.reasonType] || item.reasonType}</span><Tag>{violation ? 'Vi phạm' : 'Chấm công'}</Tag>{item.hasExplanation && <Tag color="processing">Đã giải trình · chờ HR</Tag>}</div>
                  <p className="mt-1 text-sm text-slate-600">{item.description || 'Cần cung cấp thêm thông tin.'}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.date ? dayjs(item.date).format('DD/MM/YYYY') : 'Không rõ ngày'}</p>
                </div>
                <BaseButton type="primary" size="small" onClick={() => { setSelected(item); setNote(item.employeeNote || ''); setPhoto(null); }}>{item.hasExplanation ? 'Cập nhật giải trình' : 'Giải thích'}</BaseButton>
              </div>
            );
            })}
          </div>
        )}
      </Card>
      <BaseModal
        title={selected?.hasExplanation ? 'Cập nhật giải trình' : 'Gửi giải trình'}
        isOpen={Boolean(selected)}
        onClose={() => { if (!explain.isPending) { setSelected(null); setNote(''); setPhoto(null); } }}
        onConfirm={() => void submit()}
        confirmText="Gửi cho HR"
        confirmLoading={explain.isPending}
        confirmButtonProps={{ disabled: !note.trim() }}
        width={580}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">{selected ? reasonLabels[selected.reasonType] || selected.reasonType : ''}</p>
          {selected?.hasExplanation && <Alert type="info" showIcon title="HR chưa xử lý mục này" description="Bạn có thể cập nhật nội dung hoặc thay ảnh bằng chứng đã gửi trước đó." />}
          <BaseTextArea rows={6} maxLength={1000} showCount value={note} onChange={(event) => setNote(event.target.value)} placeholder="Mô tả sự việc, nguyên nhân và thông tin HR cần biết..." />
          <div className="rounded-lg border border-dashed border-slate-300 p-3">
            <p className="mb-2 text-xs text-slate-500">Ảnh bổ sung tùy chọn · JPEG/PNG/WEBP · tối đa 5MB</p>
            {photo ? (
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm text-slate-700">{photo.name}</span>
                <BaseButton size="small" danger icon={<Trash2 className="h-4 w-4" />} onClick={() => setPhoto(null)}>Xóa</BaseButton>
              </div>
            ) : (
              <Upload
                accept="image/jpeg,image/png,image/webp"
                showUploadList={false}
                beforeUpload={(file) => {
                  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    message.error('Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP.');
                    return Upload.LIST_IGNORE;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    message.error('Ảnh giải trình không được vượt quá 5MB.');
                    return Upload.LIST_IGNORE;
                  }
                  setPhoto(file);
                  return false;
                }}
              >
                <BaseButton icon={<Paperclip className="h-4 w-4" />}>Chọn ảnh bằng chứng</BaseButton>
              </Upload>
            )}
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
