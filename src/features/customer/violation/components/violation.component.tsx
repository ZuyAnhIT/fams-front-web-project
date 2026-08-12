'use client';

import { useCallback, useMemo, useState } from 'react';
import { Alert, App, DatePicker, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { AlertTriangle, Download, Eye } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ContentCard from '@/components/shared/layout/ContentCard';
import DataTable from '@/components/tables/DataTable';
import { BaseButton, BaseSelect } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useEmployees } from '@/features/customer/employee/hooks/use-employee';
import { useSitesQuery } from '@/features/customer/site/hooks/use-site';
import { formatVietnameseName } from '@/utils/name.util';
import SavedFilterToolbar from '@/features/shared/saved-filter/components/SavedFilterToolbar';
import type { SavedFilterParams } from '@/features/shared/saved-filter/types/saved-filter.type';
import { useExportViolationReport } from '@/features/customer/report/hooks/use-report-search';
import { downloadBlob, reportErrorMessage } from '@/features/customer/report/components/report-utils';

import { useViolations } from '../hooks/use-violation';
import type { ViolationListItem, ViolationListParams, ViolationType } from '../types/violation.type';
import { getViolationErrorMessage, VIOLATION_META } from '../utils/violation.mapper';
import ViolationDetailModal from './ViolationDetailModal';

const { RangePicker } = DatePicker;

export default function ViolationManagementPage() {
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId || '';
  const initialScheduledCheckId = searchParams.get('scheduledCheckId') || undefined;
  const resolvedQuery = searchParams.get('resolved');
  const initialResolved = resolvedQuery === 'true' ? true : resolvedQuery === 'false' ? false : undefined;
  const [params, setParams] = useState<ViolationListParams>({
    page: 0,
    size: 20,
    sortBy: 'checkDate',
    sortDir: 'desc',
    scheduledCheckId: initialScheduledCheckId,
    resolved: initialResolved,
  });
  const [selected, setSelected] = useState<ViolationListItem | null>(null);

  // Historical violations can belong to an inactive site, so the filter must not
  // silently hide those sites from the operator.
  const { data: sitePage } = useSitesQuery({ tenantId, page: 0, size: 100, sortBy: 'name', sortDir: 'asc' });
  const sites = useMemo(() => sitePage?.data?.content ?? [], [sitePage?.data?.content]);
  const { data: employeePage } = useEmployees({ page: 0, size: 100, sortBy: 'firstName', sortDir: 'asc' }, { enabled: Boolean(tenantId) });
  const employees = useMemo(() => employeePage?.content ?? [], [employeePage?.content]);
  const employeeNames = useMemo(() => new Map(employees.map((employee) => [employee.id, formatVietnameseName(employee.firstName, employee.lastName)])), [employees]);
  const siteNames = useMemo(() => new Map(sites.map((site) => [site.id, site.name])), [sites]);
  const query = useViolations(tenantId, params);
  const exportMutation = useExportViolationReport();
  const canExport = user?.role === 'PLATFORM_ADMIN' || Boolean(user?.permissions?.includes('reports:export'));
  const savedParams = useMemo<SavedFilterParams>(() => Object.fromEntries(
    Object.entries({
      employeeId: params.employeeId,
      siteId: params.siteId,
      violationType: params.violationType,
      resolved: params.resolved,
      from: params.from,
      to: params.to,
      scheduledCheckId: params.scheduledCheckId,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    }).filter(([, value]) => value !== undefined),
  ), [params]);

  const applySavedFilter = useCallback((stored: SavedFilterParams) => {
    const allowedTypes: ViolationType[] = ['no_response', 'location_fail', 'face_fail', 'liveness_fail', 'face_verify_timeout'];
    const allowedSort = ['checkDate', 'createdAt', 'violationType', 'employeeId', 'siteId'] as const;
    setParams((current) => ({
      page: 0,
      size: current.size || 20,
      employeeId: typeof stored.employeeId === 'string' ? stored.employeeId : undefined,
      siteId: typeof stored.siteId === 'string' ? stored.siteId : undefined,
      violationType: typeof stored.violationType === 'string' && allowedTypes.includes(stored.violationType as ViolationType)
        ? stored.violationType as ViolationType
        : undefined,
      resolved: typeof stored.resolved === 'boolean' ? stored.resolved : undefined,
      from: typeof stored.from === 'string' ? stored.from : undefined,
      to: typeof stored.to === 'string' ? stored.to : undefined,
      scheduledCheckId: typeof stored.scheduledCheckId === 'string' ? stored.scheduledCheckId : undefined,
      sortBy: typeof stored.sortBy === 'string' && allowedSort.includes(stored.sortBy as typeof allowedSort[number])
        ? stored.sortBy as typeof allowedSort[number]
        : 'checkDate',
      sortDir: stored.sortDir === 'asc' || stored.sortDir === 'desc' ? stored.sortDir : 'desc',
    }));
  }, []);

  const exportNow = async () => {
    try {
      const blob = await exportMutation.mutateAsync({
        tenantId,
        params: {
          from: params.from,
          to: params.to,
          siteId: params.siteId,
          employeeId: params.employeeId,
          violationType: params.violationType,
          resolved: params.resolved,
        },
      });
      downloadBlob(blob, `violations-${new Date().toISOString().slice(0, 10)}.xlsx`);
      message.success('Đã xuất danh sách vi phạm.');
    } catch (error) {
      message.error(reportErrorMessage(error));
    }
  };

  const columns: ColumnsType<ViolationListItem> = [
    { title: 'Ngày', dataIndex: 'checkDate', key: 'checkDate', width: 115, sorter: true, sortOrder: params.sortBy === 'checkDate' ? (params.sortDir === 'asc' ? 'ascend' : 'descend') : null, render: (value) => dayjs(value).format('DD/MM/YYYY') },
    { title: 'Nhân viên', key: 'employeeId', width: 190, sorter: true, sortOrder: params.sortBy === 'employeeId' ? (params.sortDir === 'asc' ? 'ascend' : 'descend') : null, render: (_, row) => employeeNames.get(row.employeeId) || <span className="font-mono text-xs">{row.employeeId}</span> },
    { title: 'Công trình', key: 'siteId', width: 170, sorter: true, sortOrder: params.sortBy === 'siteId' ? (params.sortDir === 'asc' ? 'ascend' : 'descend') : null, render: (_, row) => siteNames.get(row.siteId) || row.siteId },
    { title: 'Loại vi phạm', dataIndex: 'violationType', key: 'violationType', width: 170, sorter: true, sortOrder: params.sortBy === 'violationType' ? (params.sortDir === 'asc' ? 'ascend' : 'descend') : null, render: (value: ViolationType) => <Tag color={VIOLATION_META[value].color}>{VIOLATION_META[value].label}</Tag> },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', width: 280, ellipsis: { showTitle: false }, render: (value) => <Tooltip title={value}><span>{value || '—'}</span></Tooltip> },
    { title: 'Giải trình', key: 'explanation', width: 125, render: (_, row) => row.employeeNote ? <Tag color="blue">Đã gửi</Tag> : <Tag>Chưa có</Tag> },
    { title: 'Trạng thái', key: 'resolved', width: 170, render: (_, row) => {
      if (!row.resolved) return <Tag color="warning">Chưa xử lý</Tag>;
      if (row.resolution === 'confirmed') return <Tag color="error">Đã xác nhận vi phạm</Tag>;
      if (row.resolution === 'dismissed') return <Tag color="success">Đã bỏ qua</Tag>;
      return <Tag>Đã xử lý</Tag>;
    } },
    { title: 'Thao tác', key: 'actions', fixed: 'right', width: 115, render: (_, row) => <BaseButton type="link" icon={<Eye className="h-4 w-4" />} onClick={() => setSelected(row)}>Chi tiết</BaseButton> },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl"><AlertTriangle className="h-7 w-7 text-red-600" />Quản lý vi phạm</h1>
        <p className="mt-1 text-sm text-slate-500">Đối chiếu vi phạm tự động từ random check/check-in, giải trình của nhân viên và bằng chứng xác thực.</p>
      </div>

      <Alert type="info" showIcon title="Vi phạm được hệ thống tạo tự động" description="HR không tạo vi phạm thủ công. Khi cần xác minh tình huống nghi ngờ, hãy dùng chức năng Kiểm tra ngay trong màn Kiểm tra ngẫu nhiên." />
      {params.scheduledCheckId && <Alert type="warning" showIcon closable onClose={() => setParams((current) => ({ ...current, scheduledCheckId: undefined, page: 0 }))} title="Đang lọc theo một lượt kiểm tra cụ thể" description={<span className="font-mono text-xs">{params.scheduledCheckId}</span>} />}

      <ContentCard className="p-5">
        <div className="mb-4">
          <SavedFilterToolbar
            tenantId={tenantId}
            resourceType="violations"
            currentParams={savedParams}
            onApply={applySavedFilter}
            skipDefault={Boolean(initialScheduledCheckId || resolvedQuery)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <BaseSelect allowClear showSearch optionFilterProp="label" placeholder="Tất cả nhân viên" value={params.employeeId} onChange={(employeeId) => setParams((current) => ({ ...current, employeeId, page: 0 }))} options={employees.map((employee) => ({ value: employee.id, label: formatVietnameseName(employee.firstName, employee.lastName) }))} />
          <BaseSelect allowClear showSearch optionFilterProp="label" placeholder="Tất cả công trình" value={params.siteId} onChange={(siteId) => setParams((current) => ({ ...current, siteId, page: 0 }))} options={sites.map((site) => ({ value: site.id, label: site.name }))} />
          <BaseSelect allowClear placeholder="Tất cả loại vi phạm" value={params.violationType} onChange={(violationType) => setParams((current) => ({ ...current, violationType, page: 0 }))} options={Object.entries(VIOLATION_META).map(([value, meta]) => ({ value, label: meta.label }))} />
          <BaseSelect allowClear placeholder="Tất cả trạng thái" value={params.resolved == null ? undefined : String(params.resolved)} onChange={(value) => setParams((current) => ({ ...current, resolved: value == null ? undefined : value === 'true', page: 0 }))} options={[{ value: 'false', label: 'Chưa xử lý' }, { value: 'true', label: 'Đã xử lý' }]} />
          <RangePicker className="w-full" onChange={(_, values) => setParams((current) => ({ ...current, from: values[0] || undefined, to: values[1] || undefined, page: 0 }))} />
        </div>
      </ContentCard>

      {canExport && (
        <div className="flex justify-end">
          <BaseButton icon={<Download className="h-4 w-4" />} loading={exportMutation.isPending} onClick={() => void exportNow()}>
            Xuất Excel theo bộ lọc
          </BaseButton>
        </div>
      )}

      {query.isError && <Alert type="error" showIcon title="Không thể tải danh sách vi phạm" description={getViolationErrorMessage(query.error, 'Vui lòng thử lại.')} />}
      <DataTable
        ariaLabel="Danh sách vi phạm"
        columns={columns}
        data={query.data?.data?.content || []}
        loading={query.isLoading || query.isFetching}
        totalElements={query.data?.data?.totalElements || 0}
        currentPage={params.page || 0}
        pageSize={params.size || 20}
        onPageChange={(page, size) => setParams((current) => ({ ...current, page, size }))}
        onChange={(_, __, sorter) => {
          const item = Array.isArray(sorter) ? sorter[0] : sorter;
          const sortBy = item?.columnKey as ViolationListParams['sortBy'] | undefined;
          if (!item?.order || !sortBy) return;
          setParams((current) => ({
            ...current,
            sortBy,
            sortDir: item.order === 'ascend' ? 'asc' : 'desc',
            page: 0,
          }));
        }}
        emptyTitle="Không có vi phạm phù hợp"
        emptyDescription="Thử thay đổi nhân viên, công trình, loại, trạng thái hoặc khoảng ngày."
        scroll={{ x: 1320 }}
      />

      <ViolationDetailModal tenantId={tenantId} violationId={selected?.id || null} employeeName={selected ? employeeNames.get(selected.employeeId) : undefined} siteName={selected ? siteNames.get(selected.siteId) : undefined} onClose={() => setSelected(null)} />
    </div>
  );
}
