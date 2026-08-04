'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, App, Descriptions, Image, Spin, Switch, Tag } from 'antd';
import dayjs from 'dayjs';
import { CheckCircle, XCircle } from 'lucide-react';
import BaseButton from '@/components/ui/BaseButton';
import BaseModal from '@/components/ui/BaseModal';
import CheckinDetailModal from '@/features/customer/checkin/components/CheckinDetailModal';
import { useAuthStore } from '@/stores/auth.store';

import { useConfirmViolation, useDismissViolation, useUpdateViolationAttendanceImpact, useViolationDetail, useViolationExplanationPhoto } from '../hooks/use-violation';
import { getViolationErrorMessage, VIOLATION_META } from '../utils/violation.mapper';
import ViolationResolutionModal from './ViolationResolutionModal';

interface Props {
  tenantId: string;
  violationId: string | null;
  employeeName?: string;
  siteName?: string;
  onClose: () => void;
}

function booleanTag(value: boolean | null, pending = 'Đang xử lý') {
  if (value == null) return <Tag>{pending}</Tag>;
  return value ? <Tag color="success">Đạt</Tag> : <Tag color="error">Không đạt</Tag>;
}

export default function ViolationDetailModal({ tenantId, violationId, employeeName, siteName, onClose }: Props) {
  const { message } = App.useApp();
  const canUpdate = useAuthStore((state) => state.hasPermission('violations:update'));
  const detail = useViolationDetail(tenantId, violationId);
  const confirm = useConfirmViolation();
  const dismiss = useDismissViolation();
  const updateImpact = useUpdateViolationAttendanceImpact();
  const [action, setAction] = useState<'confirm' | 'dismiss' | null>(null);
  const [note, setNote] = useState('');
  const [relatedCheckinOpen, setRelatedCheckinOpen] = useState(false);
  const data = detail.data?.data;
  const managedPhoto = Boolean(data?.employeePhotoUrl?.startsWith(`/api/v1/tenants/${tenantId}/`));
  const photoQuery = useViolationExplanationPhoto(tenantId, violationId, data?.employeePhotoUrl);
  const protectedPhotoUrl = useMemo(
    () => photoQuery.data ? URL.createObjectURL(photoQuery.data) : null,
    [photoQuery.data],
  );
  useEffect(() => () => {
    if (protectedPhotoUrl) URL.revokeObjectURL(protectedPhotoUrl);
  }, [protectedPhotoUrl]);

  const submitResolution = async () => {
    if (!data || !action || (action === 'dismiss' && !note.trim())) return;
    try {
      if (action === 'confirm') {
        await confirm.mutateAsync({ tenantId, violationId: data.id, note: note.trim() });
      } else {
        await dismiss.mutateAsync({ tenantId, violationId: data.id, reason: note.trim() });
      }
      message.success(action === 'confirm' ? 'Đã xác nhận vi phạm.' : 'Đã bỏ qua vi phạm và lưu lý do.');
      setAction(null);
      setNote('');
    } catch (error) {
      message.error(getViolationErrorMessage(error, 'Không thể xử lý vi phạm.'));
    }
  };

  const openResolution = (next: 'confirm' | 'dismiss') => {
    setNote('');
    setAction(next);
  };

  return (
    <>
      <BaseModal title="Chi tiết vi phạm" isOpen={Boolean(violationId)} onClose={() => { setRelatedCheckinOpen(false); onClose(); }} hideFooter width={820}>
        {detail.isLoading ? (
          <div className="flex justify-center py-12"><Spin size="large" /></div>
        ) : detail.isError ? (
          <Alert type="error" showIcon title="Không thể tải chi tiết vi phạm" description={getViolationErrorMessage(detail.error, 'Bản ghi không tồn tại hoặc nằm ngoài phạm vi công trình được cấp.')} />
        ) : data ? (
          <div className="space-y-5">
            <Alert
              type={data.resolved ? 'success' : 'warning'}
              showIcon
              title={data.resolved ? 'Vi phạm đã được xử lý' : 'Vi phạm đang chờ HR xử lý'}
              description={data.resolved
                ? `${data.resolution === 'confirmed' ? 'Đã xác nhận vi phạm' : 'Đã bỏ qua false positive'}${data.resolvedAt ? ` lúc ${dayjs(data.resolvedAt).format('DD/MM/YYYY HH:mm:ss')}` : ''}.`
                : 'Hãy đối chiếu giải trình và bằng chứng trước khi quyết định.'}
            />
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Loại"><Tag color={VIOLATION_META[data.violationType].color}>{VIOLATION_META[data.violationType].label}</Tag></Descriptions.Item>
              <Descriptions.Item label="Ngày">{dayjs(data.checkDate).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Nhân viên">{employeeName || data.employeeId}</Descriptions.Item>
              <Descriptions.Item label="Công trình">{siteName || data.siteId}</Descriptions.Item>
              <Descriptions.Item label="Nguồn" span={2}>
                <div className="flex flex-wrap items-center gap-2">
                  <span>{data.scheduledCheckId ? 'Kiểm tra ngẫu nhiên' : data.checkinId ? 'Chấm công thường' : 'Không xác định'}</span>
                  {data.checkinId && (
                    <BaseButton type="link" size="small" onClick={() => setRelatedCheckinOpen(true)}>
                      Mở hồ sơ chấm công
                    </BaseButton>
                  )}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>{data.description || '—'}</Descriptions.Item>
            </Descriptions>

            {data.resolved && (
              <Descriptions title="Quyết định xử lý" bordered size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Kết quả">
                  {data.resolution === 'confirmed'
                    ? <Tag color="error">Đã xác nhận vi phạm</Tag>
                    : <Tag color="success">Đã bỏ qua</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="Người xử lý">
                  <span className="font-mono text-xs">{data.resolvedBy || '—'}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Lý do/ghi chú" span={2}>{data.resolutionReason || 'Không có ghi chú'}</Descriptions.Item>
              </Descriptions>
            )}

            <Descriptions title="Giải trình của nhân viên" bordered size="small" column={1}>
              <Descriptions.Item label="Nội dung">{data.employeeNote || 'Chưa gửi giải trình'}</Descriptions.Item>
              <Descriptions.Item label="Ảnh bổ sung">
                {data.employeePhotoUrl ? (
                  managedPhoto
                    ? photoQuery.isLoading ? 'Đang tải ảnh có bảo vệ…' : protectedPhotoUrl ? <Image width={180} src={protectedPhotoUrl} alt="Ảnh giải trình của nhân viên" /> : 'Không thể tải ảnh bằng chứng'
                    : <Image width={180} src={data.employeePhotoUrl} alt="Ảnh giải trình của nhân viên" />
                ) : 'Không có ảnh bổ sung'}
              </Descriptions.Item>
            </Descriptions>

            {data.scheduledCheck && (
              <Descriptions title="Lượt kiểm tra liên quan" bordered size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Giờ dự kiến">{dayjs(data.scheduledCheck.scheduledAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
                <Descriptions.Item label="Hết hạn">{data.scheduledCheck.expiresAt ? dayjs(data.scheduledCheck.expiresAt).format('DD/MM/YYYY HH:mm:ss') : '—'}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">{data.scheduledCheck.status}</Descriptions.Item>
                <Descriptions.Item label="Chỉ số lượt">#{data.scheduledCheck.checkIndex}</Descriptions.Item>
              </Descriptions>
            )}

            {data.checkResponse ? (
              <Descriptions title="Bằng chứng phản hồi" bordered size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Thời điểm">{dayjs(data.checkResponse.respondedAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
                <Descriptions.Item label="Kết quả"><Tag color={data.checkResponse.outcome === 'pass' ? 'success' : 'error'}>{data.checkResponse.outcome === 'pass' ? 'Đạt' : 'Không đạt'}</Tag></Descriptions.Item>
                <Descriptions.Item label="GPS">
                  <a href={`https://www.google.com/maps?q=${data.checkResponse.latitude},${data.checkResponse.longitude}`} target="_blank" rel="noreferrer">{data.checkResponse.latitude}, {data.checkResponse.longitude}</a>
                </Descriptions.Item>
                <Descriptions.Item label="Độ chính xác">{data.checkResponse.accuracyMeters != null ? `${data.checkResponse.accuracyMeters} m` : '—'}</Descriptions.Item>
                <Descriptions.Item label="Trong geofence">{booleanTag(data.checkResponse.locationVerified)}</Descriptions.Item>
                <Descriptions.Item label="Face ID">{booleanTag(data.checkResponse.faceVerified)}</Descriptions.Item>
                <Descriptions.Item label="Liveness">{booleanTag(data.checkResponse.livenessVerified, 'Không áp dụng/đang xử lý')}</Descriptions.Item>
                <Descriptions.Item label="Điểm liveness">{data.checkResponse.livenessScore == null ? '—' : `${(data.checkResponse.livenessScore * 100).toFixed(1)}%`}</Descriptions.Item>
                <Descriptions.Item label="Lý do lỗi" span={2}>{data.checkResponse.failureReason || '—'}</Descriptions.Item>
                <Descriptions.Item label="Ảnh khuôn mặt" span={2}>{data.checkResponse.faceImageUrl ? <Image width={220} src={data.checkResponse.faceImageUrl} alt="Ảnh khuôn mặt dùng làm bằng chứng" /> : 'Không có ảnh'}</Descriptions.Item>
              </Descriptions>
            ) : data.violationType === 'no_response' ? (
              <Alert type="info" showIcon title="Không có bằng chứng phản hồi" description="Nhân viên không phản hồi trong thời hạn nên không có GPS hoặc ảnh khuôn mặt cho lượt này." />
            ) : null}

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">Đánh dấu ảnh hưởng bảng công</p>
                  <p className="text-xs text-slate-500">Đây chỉ là cờ cảnh báo; không tự trừ công, OT hoặc lương.</p>
                </div>
                <Switch
                  checked={data.affectsAttendance}
                  disabled={!canUpdate}
                  loading={updateImpact.isPending}
                  onChange={async (affectsAttendance) => {
                    try {
                      await updateImpact.mutateAsync({ tenantId, violationId: data.id, affectsAttendance });
                      message.success('Đã cập nhật cờ ảnh hưởng bảng công.');
                    } catch (error) {
                      message.error(getViolationErrorMessage(error, 'Không thể cập nhật cờ bảng công.'));
                    }
                  }}
                />
              </div>
            </div>

            {canUpdate && !data.resolved && (
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <BaseButton icon={<XCircle className="h-4 w-4" />} onClick={() => openResolution('dismiss')}>Bỏ qua false positive</BaseButton>
                <BaseButton danger icon={<CheckCircle className="h-4 w-4" />} onClick={() => openResolution('confirm')}>Xác nhận vi phạm</BaseButton>
              </div>
            )}
          </div>
        ) : null}
      </BaseModal>

      <ViolationResolutionModal
        action={action}
        note={note}
        loading={confirm.isPending || dismiss.isPending}
        onNoteChange={setNote}
        onClose={() => { setAction(null); setNote(''); }}
        onConfirm={() => void submitResolution()}
      />
      <CheckinDetailModal
        checkinId={data?.checkinId || null}
        isOpen={relatedCheckinOpen && Boolean(data?.checkinId)}
        onClose={() => setRelatedCheckinOpen(false)}
      />
    </>
  );
}
