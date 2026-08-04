'use client';

import { Alert } from 'antd';
import BaseModal from '@/components/ui/BaseModal';
import BaseTextArea from '@/components/ui/BaseTextArea';

interface Props {
  action: 'confirm' | 'dismiss' | null;
  note: string;
  loading: boolean;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ViolationResolutionModal({ action, note, loading, onNoteChange, onClose, onConfirm }: Props) {
  const dismiss = action === 'dismiss';
  return (
    <BaseModal
      title={dismiss ? 'Bỏ qua vi phạm' : 'Xác nhận vi phạm'}
      isOpen={Boolean(action)}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmLoading={loading}
      confirmText={dismiss ? 'Xác nhận bỏ qua' : 'Xác nhận vi phạm'}
      confirmButtonProps={{ danger: !dismiss, disabled: dismiss && !note.trim() }}
      width={560}
    >
      <div className="space-y-4">
        <Alert
          type={dismiss ? 'warning' : 'error'}
          showIcon
          title={dismiss ? 'Lý do là bắt buộc và sẽ được lưu audit' : 'Vi phạm chỉ có thể xử lý một lần'}
          description={dismiss
            ? 'Chỉ bỏ qua khi đã đối chiếu đủ bằng chứng và xác định đây là false positive.'
            : 'Sau khi xác nhận, hệ thống không cung cấp thao tác hoàn tác.'}
        />
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {dismiss ? 'Lý do bỏ qua *' : 'Ghi chú xác nhận (không bắt buộc)'}
          </label>
          <BaseTextArea
            rows={5}
            maxLength={1000}
            showCount
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={dismiss ? 'Nêu căn cứ xác định vi phạm không hợp lệ...' : 'Ghi chú kết quả đối chiếu GPS, ảnh hoặc trao đổi với nhân viên...'}
          />
          {dismiss && !note.trim() && <p className="mt-1 text-xs text-red-600">Nhập lý do trước khi xác nhận bỏ qua.</p>}
        </div>
      </div>
    </BaseModal>
  );
}
