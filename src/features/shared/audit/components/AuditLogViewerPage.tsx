'use client';

import { useMemo, useState } from 'react';
import { Alert, App, DatePicker, Descriptions, Input, Modal, Spin, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ClipboardCopy, Eye, Filter, Route, Search, ShieldCheck, X } from 'lucide-react';
import ContentCard from '@/components/shared/layout/ContentCard';
import DataTable from '@/components/tables/DataTable';
import { BaseButton, BaseSelect } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useTenants } from '@/features/admin/tenant/hooks/use-tenant';
import { useSearchUsers } from '@/hooks/use-user';
import { useEmployees } from '@/features/customer/employee/hooks/use-employee';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuditLogDetail, useAuditLogs } from '../hooks/use-audit-logs';
import type { AuditLogEntry, AuditLogListParams } from '../types/audit-log.type';
import JsonDiffViewer from './JsonDiffViewer';

const { RangePicker } = DatePicker;

const ENTITY_TYPE_LABELS: Record<string, string> = {
  Tenant: 'Công ty', Role: 'Vai trò', UserRole: 'Gán vai trò', TenantSubscription: 'Gói dịch vụ (đăng ký)',
  Plan: 'Gói dịch vụ', PlanLimits: 'Giới hạn gói', PlanLimit: 'Giới hạn gói',
  USER: 'Người dùng', Employee: 'Nhân viên', Site: 'Công trình', Workspace: 'Phòng ban',
  Department: 'Phòng ban', Shift: 'Ca làm việc', Assignment: 'Phân công', Checkin: 'Lượt chấm công',
  EmployeeInvitation: 'Lời mời nhân viên', RandomCheckConfig: 'Cấu hình kiểm tra ngẫu nhiên',
  ScheduledCheck: 'Lịch kiểm tra ngẫu nhiên', Violation: 'Vi phạm', ViolationExport: 'Xuất file vi phạm',
  AttendanceSummary: 'Bảng công', AttendanceExport: 'Xuất file chấm công', Geofence: 'Vùng chấm công',
  WorkspaceMember: 'Thành viên phòng ban', TenantSettings: 'Cấu hình công ty', FaceProfile: 'Hồ sơ Face ID',
  AccessControl: 'Kiểm soát truy cập',
};

// Vietnamese labels for the audit action strings; anything not listed falls through
// `formatAction()` which humanises snake_case / SCREAMING_CASE.
const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới', UPDATE: 'Cập nhật', DELETE: 'Xoá',
  LOGIN: 'Đăng nhập', LOGOUT: 'Đăng xuất', LOGIN_FAILED: 'Đăng nhập thất bại',
  ACCESS_DENIED: 'Từ chối truy cập', PLAN_LIMIT_DENIED: 'Chặn do vượt giới hạn gói',
  SUSPEND: 'Tạm ngưng', REACTIVATE: 'Kích hoạt lại', CANCEL: 'Huỷ',
  employee_created: 'Tạo nhân viên', employee_updated: 'Cập nhật nhân viên',
  employee_status_changed: 'Đổi trạng thái nhân viên', employee_deleted: 'Xoá nhân viên',
  invitation_sent: 'Gửi lời mời', site_created: 'Tạo công trình', site_updated: 'Cập nhật công trình',
  shift_created: 'Tạo ca làm', shift_updated: 'Cập nhật ca làm', shift_ot_configured: 'Cấu hình OT ca làm',
  assignment_created: 'Tạo phân công', assignment_updated: 'Cập nhật phân công', assignment_cancelled: 'Huỷ phân công',
  workspace_created: 'Tạo phòng ban', workspace_updated: 'Cập nhật phòng ban',
  workspace_member_assigned: 'Thêm thành viên phòng ban', workspace_member_removed: 'Gỡ thành viên phòng ban',
  role_created: 'Tạo vai trò', role_updated: 'Cập nhật vai trò', role_deleted: 'Xoá vai trò',
  role_assigned: 'Gán vai trò', role_revoked: 'Thu hồi vai trò',
  checkin_submitted: 'Chấm công vào', checkout_submitted: 'Chấm công ra', checkin_overridden: 'Ghi đè lượt chấm công',
  subscription_updated: 'Cập nhật gói dịch vụ', tenant_updated: 'Cập nhật công ty', tenant_settings_updated: 'Cập nhật cấu hình công ty',
  random_check_config_created: 'Tạo cấu hình kiểm tra ngẫu nhiên', random_check_config_updated: 'Cập nhật cấu hình kiểm tra ngẫu nhiên',
  random_check_config_deleted: 'Xoá cấu hình kiểm tra ngẫu nhiên', manual_random_check_triggered: 'Kích hoạt kiểm tra ngẫu nhiên thủ công',
  geofence_created: 'Tạo vùng chấm công', geofence_updated: 'Cập nhật vùng chấm công',
  plan_created: 'Tạo gói dịch vụ', plan_updated: 'Cập nhật gói dịch vụ',
  attendance_summary_adjusted: 'Điều chỉnh bảng công',
  EXPORT_VIOLATIONS: 'Xuất file vi phạm', EXPORT_ATTENDANCE: 'Xuất file chấm công',
};

function formatAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const words = action.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function actionColor(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes('suspend')) return 'warning';
  if (normalized.includes('delete') || normalized.includes('cancel') || normalized.includes('revoke')) return 'error';
  if (normalized.includes('create') || normalized.includes('assign') || normalized.includes('reactivate')) return 'success';
  if (normalized.includes('update')) return 'processing';
  return 'default';
}

function errorMessage(error: unknown) {
  const response = (error as { response?: { status?: number; data?: { message?: string } } } | null | undefined)?.response;
  if (response?.status === 403) return 'Bạn không có quyền xem audit log trong phạm vi này. Với tài khoản đa công ty, hãy chuyển đúng công ty trước khi thử lại.';
  return response?.data?.message || 'Không thể tải nhật ký audit.';
}

export default function AuditLogViewerPage({ platformMode }: { platformMode: boolean }) {
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const currentTenantId = user?.tenantId || undefined;
  const canReadDetail = platformMode || Boolean(user?.permissions?.includes('audit:read'));
  const initialTenantId = platformMode ? undefined : currentTenantId;
  const [draft, setDraft] = useState<AuditLogListParams>({ tenantId: initialTenantId, page: 0, size: 20 });
  const [params, setParams] = useState<AuditLogListParams>({ tenantId: initialTenantId, page: 0, size: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actorLabel, setActorLabel] = useState<string | null>(null);

  // Actor filter is a name/email search-to-select, not a raw UUID field — nobody remembers a
  // UUID to type it correctly. Platform mode searches the platform-wide user directory (only
  // Platform Admin can call GET /users); company mode searches this tenant's own employees
  // (Employee.userId is the same ID audit entries are keyed by).
  const [actorSearch, setActorSearch] = useState('');
  const debouncedActorSearch = useDebounce(actorSearch, 300);
  const { data: platformUserResults, isFetching: isSearchingPlatformUsers } = useSearchUsers(
    { search: debouncedActorSearch, size: 8, sortBy: 'displayName', sortDir: 'asc' },
    platformMode,
  );
  const { data: employeeResults, isFetching: isSearchingEmployees } = useEmployees(
    { search: debouncedActorSearch, size: 8, sortBy: 'fullName', sortDir: 'asc' },
    { enabled: !platformMode && debouncedActorSearch.length >= 2 },
  );
  const actorOptions = platformMode
    ? (platformUserResults?.content || []).map((u) => ({ value: u.id, label: `${u.displayName || 'Chưa đặt tên'} — ${u.email || 'không có email'}` }))
    : (employeeResults?.content || []).map((e) => ({ value: e.userId, label: `${e.fullName} — ${e.email || 'không có email'}` }));
  const isSearchingActor = platformMode ? isSearchingPlatformUsers : isSearchingEmployees;
  // Auth state hydrates client-side. Overlay the current tenant at request time so
  // a tenant admin can never issue an unscoped query during that hydration window.
  const scopedParams = platformMode ? params : { ...params, tenantId: currentTenantId };
  const query = useAuditLogs(scopedParams, platformMode || Boolean(currentTenantId));
  const detailQuery = useAuditLogDetail(selectedId, canReadDetail);
  const tenantsQuery = useTenants({ page: 0, size: 100, sortBy: 'name', sortDir: 'asc' }, platformMode);
  const tenantNames = useMemo(() => new Map((tenantsQuery.data?.content || []).map((tenant) => [tenant.id, tenant.name])), [tenantsQuery.data?.content]);

  const applyFilters = () => setParams({ ...draft, tenantId: platformMode ? draft.tenantId : currentTenantId, page: 0, size: params.size || 20 });
  const clearFilters = () => {
    const clean = { tenantId: initialTenantId, page: 0, size: params.size || 20 };
    setDraft(clean);
    setParams(clean);
    setActorLabel(null);
    setActorSearch('');
  };
  const trace = (requestId: string, tenantId?: string) => {
    const traced = { tenantId: platformMode ? tenantId : currentTenantId, requestId, page: 0, size: 200 };
    setDraft(traced);
    setParams(traced);
  };
  const copyRequestId = async (requestId: string) => {
    await navigator.clipboard.writeText(requestId);
    message.success('Đã sao chép request ID.');
  };

  const columns: ColumnsType<AuditLogEntry> = [
    { title: 'Thời gian', dataIndex: 'createdAt', width: 170, render: (value) => dayjs(value).format('DD/MM/YYYY HH:mm:ss') },
    ...(platformMode ? [{ title: 'Công ty', dataIndex: 'tenantId', width: 180, render: (value: string) => tenantNames.get(value) || <code className="text-xs">{value}</code> }] : []),
    { title: 'Người thao tác', key: 'actor', width: 200, render: (_, row) => (
      <div>
        <p className="font-medium">{row.actorName || row.actorEmail || 'Hệ thống tự động'}</p>
        {row.actorName && row.actorEmail && <p className="text-[11px] text-slate-400">{row.actorEmail}</p>}
      </div>
    ) },
    { title: 'Hành động', dataIndex: 'action', width: 190, render: (value: string) => <Tag color={actionColor(value)}>{formatAction(value)}</Tag> },
    { title: 'Đối tượng', key: 'entity', width: 230, render: (_, row) => (
      <div>
        <p className="font-semibold">{row.entityName || ENTITY_TYPE_LABELS[row.entityType] || row.entityType}</p>
        <p className="text-[11px] text-slate-500">
          {ENTITY_TYPE_LABELS[row.entityType] || row.entityType}
          {row.entityId && <Tooltip title={row.entityId}><span className="ml-1 cursor-help">· {row.entityId.length === 36 ? `${row.entityId.slice(0, 8)}…` : row.entityId}</span></Tooltip>}
        </p>
      </div>
    ) },
    { title: 'Request ID', dataIndex: 'requestId', width: 240, render: (value: string | null, row) => value ? <div className="flex items-center gap-1"><Tooltip title={value}><code className="max-w-40 truncate text-xs">{value}</code></Tooltip><BaseButton type="text" size="small" aria-label={`Sao chép request ID ${value}`} icon={<ClipboardCopy className="h-3.5 w-3.5" />} onClick={() => void copyRequestId(value)} /><BaseButton type="text" size="small" aria-label={`Trace request ${value}`} icon={<Route className="h-3.5 w-3.5" />} onClick={() => trace(value, row.tenantId)} /></div> : '—' },
    { title: 'IP', dataIndex: 'ipAddress', width: 130, render: (value) => value || '—' },
    { title: 'Chi tiết', key: 'detail', fixed: 'right', width: 100, render: (_, row) => <BaseButton type="link" disabled={!canReadDetail} icon={<Eye className="h-4 w-4" />} onClick={() => setSelectedId(row.id)}>Xem</BaseButton> },
  ];

  return (
    <div className="mx-auto max-w-[1700px] space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl"><ShieldCheck className="h-7 w-7 text-blue-600" />Nhật ký audit</h1>
        <p className="mt-1 text-sm text-slate-500">Truy vết ai đã thao tác, dữ liệu trước/sau và chuỗi hành động cùng request.</p>
      </div>

      {!platformMode && <Alert showIcon type="info" title="Dữ liệu được giới hạn theo công ty đang chọn" description="Web luôn gửi tenantId hiện tại để tài khoản thuộc nhiều công ty không gặp lỗi mơ hồ hoặc xem nhầm phạm vi." />}
      {params.requestId && <Alert showIcon type="warning" title="Đang ở chế độ trace request" description={<code>{params.requestId}</code>} action={<BaseButton type="text" icon={<X className="h-4 w-4" />} onClick={clearFilters}>Thoát trace</BaseButton>} />}

      <ContentCard className="space-y-4 p-5">
        <div className="flex items-center gap-2 font-semibold text-slate-800"><Filter className="h-4 w-4 text-blue-600" />Bộ lọc điều tra</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {platformMode && <BaseSelect allowClear showSearch optionFilterProp="label" placeholder="Tất cả công ty" value={draft.tenantId} onChange={(tenantId) => setDraft((current) => ({ ...current, tenantId }))} options={(tenantsQuery.data?.content || []).map((tenant) => ({ value: tenant.id, label: tenant.name }))} />}
          <BaseSelect
            allowClear
            showSearch
            filterOption={false}
            value={draft.actorId}
            onSearch={setActorSearch}
            onChange={(value, option) => {
              setDraft((current) => ({ ...current, actorId: value || undefined }));
              setActorLabel(value ? (Array.isArray(option) ? option[0]?.label : option?.label) as string : null);
            }}
            loading={isSearchingActor}
            placeholder="Tìm người thao tác theo tên hoặc email"
            notFoundContent={debouncedActorSearch.length < 2 ? 'Nhập ít nhất 2 ký tự để tìm' : 'Không tìm thấy'}
            options={draft.actorId && actorLabel && !actorOptions.some((o) => o.value === draft.actorId)
              ? [{ value: draft.actorId, label: actorLabel }, ...actorOptions]
              : actorOptions}
          />
          <BaseSelect allowClear showSearch optionFilterProp="label" placeholder="Loại đối tượng" value={draft.entityType} onChange={(entityType) => setDraft((current) => ({ ...current, entityType }))} options={Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
          <Input placeholder="ID đối tượng (nếu biết)" value={draft.entityId} onChange={(event) => setDraft((current) => ({ ...current, entityId: event.target.value || undefined }))} />
          <BaseSelect allowClear showSearch optionFilterProp="label" placeholder="Hành động" value={draft.action} onChange={(action) => setDraft((current) => ({ ...current, action }))} options={['CREATE', 'UPDATE', 'DELETE', 'SUSPEND', 'REACTIVATE', 'CANCEL', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'ACCESS_DENIED', 'employee_status_changed', 'role_assigned', 'role_revoked', 'assignment_created', 'assignment_cancelled', 'checkin_submitted', 'checkout_submitted', 'subscription_updated'].map((value) => ({ value, label: formatAction(value) }))} />
          <Input placeholder="Request ID để trace" value={draft.requestId} onChange={(event) => setDraft((current) => ({ ...current, requestId: event.target.value || undefined }))} />
          <RangePicker className="w-full xl:col-span-2" showTime onChange={(dates) => setDraft((current) => ({ ...current, from: dates?.[0]?.toISOString(), to: dates?.[1]?.toISOString() }))} />
        </div>
        <div className="flex justify-end gap-2"><BaseButton type="default" onClick={clearFilters}>Đặt lại</BaseButton><BaseButton icon={<Search className="h-4 w-4" />} onClick={applyFilters}>Tìm kiếm</BaseButton></div>
      </ContentCard>

      {query.isError && <Alert showIcon type="error" title="Không thể tải nhật ký audit" description={errorMessage(query.error)} />}
      <DataTable
        ariaLabel="Danh sách nhật ký audit"
        columns={columns}
        data={query.data?.content || []}
        loading={query.isLoading || query.isFetching}
        totalElements={query.data?.totalElements || 0}
        currentPage={params.page || 0}
        pageSize={params.size || 20}
        showPagination={!params.requestId}
        onPageChange={(page, size) => setParams((current) => ({ ...current, page, size }))}
        emptyTitle={params.requestId ? 'Không có hành động trong request này thuộc phạm vi của bạn' : 'Chưa có audit log phù hợp'}
        emptyDescription="Thử thay đổi actor, đối tượng, hành động hoặc khoảng thời gian."
        scroll={{ x: 1450 }}
      />

      <Modal title="Chi tiết thay đổi" open={Boolean(selectedId)} width={1100} footer={null} onCancel={() => setSelectedId(null)} destroyOnHidden>
        {detailQuery.isLoading ? <div className="flex min-h-64 items-center justify-center"><Spin /></div> : detailQuery.isError || !detailQuery.data ? <Alert showIcon type="error" title="Không thể tải chi tiết" description={errorMessage(detailQuery.error)} /> : <div className="space-y-5 pt-3">
          <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="Người thao tác">
              {detailQuery.data.actorName || detailQuery.data.actorEmail || 'Hệ thống tự động'}
              {detailQuery.data.actorName && detailQuery.data.actorEmail && (
                <span className="ml-1 text-xs text-slate-400">({detailQuery.data.actorEmail})</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Hành động"><Tag color={actionColor(detailQuery.data.action)}>{formatAction(detailQuery.data.action)}</Tag></Descriptions.Item>
            <Descriptions.Item label="Đối tượng">
              <span className="font-semibold">{detailQuery.data.entityName || ENTITY_TYPE_LABELS[detailQuery.data.entityType] || detailQuery.data.entityType}</span>
              <span className="ml-1 text-xs text-slate-500">
                ({ENTITY_TYPE_LABELS[detailQuery.data.entityType] || detailQuery.data.entityType}
                {detailQuery.data.entityId ? ` · ${detailQuery.data.entityId}` : ''})
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">{dayjs(detailQuery.data.createdAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
            {detailQuery.data.endpoint && <Descriptions.Item label="Endpoint" span={2}><code className="text-xs">{detailQuery.data.endpoint}</code>{detailQuery.data.httpStatus ? ` · HTTP ${detailQuery.data.httpStatus}` : ''}</Descriptions.Item>}
            <Descriptions.Item label="Request ID" span={2}><code>{detailQuery.data.requestId || '—'}</code></Descriptions.Item>
            <Descriptions.Item label="IP">{detailQuery.data.ipAddress || '—'}</Descriptions.Item>
            <Descriptions.Item label="User agent">{detailQuery.data.userAgent || '—'}</Descriptions.Item>
          </Descriptions>
          <div><h3 className="mb-3 font-bold text-slate-800">So sánh dữ liệu trước và sau</h3><JsonDiffViewer oldValue={detailQuery.data.oldValue} newValue={detailQuery.data.newValue} /></div>
        </div>}
      </Modal>
    </div>
  );
}
