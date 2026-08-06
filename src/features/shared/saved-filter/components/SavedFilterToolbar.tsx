'use client';

import { useEffect, useRef, useState } from 'react';
import { App, Checkbox, Input, Modal, Select, Tooltip } from 'antd';
import { Bookmark, RefreshCw, Save, Star, Trash2 } from 'lucide-react';
import { BaseButton } from '@/components/ui';
import {
  useCreateSavedFilter,
  useDeleteSavedFilter,
  useSavedFilters,
  useUpdateSavedFilter,
} from '../hooks/use-saved-filters';
import type { SavedFilterParams } from '../types/saved-filter.type';

interface SavedFilterToolbarProps {
  tenantId: string;
  resourceType: string;
  currentParams: SavedFilterParams;
  onApply: (params: SavedFilterParams) => void;
  skipDefault?: boolean;
}

function errorMessage(error: unknown) {
  const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
  if (response?.status === 409) return 'Tên bộ lọc đã tồn tại. Hãy chọn tên khác.';
  return response?.data?.message || 'Không thể cập nhật bộ lọc đã lưu.';
}

export default function SavedFilterToolbar({
  tenantId,
  resourceType,
  currentParams,
  onApply,
  skipDefault = false,
}: SavedFilterToolbarProps) {
  const { message, modal } = App.useApp();
  const query = useSavedFilters(tenantId, resourceType);
  const createMutation = useCreateSavedFilter(tenantId, resourceType);
  const updateMutation = useUpdateSavedFilter(tenantId, resourceType);
  const deleteMutation = useDeleteSavedFilter(tenantId, resourceType);
  const [selectedId, setSelectedId] = useState<string | null>();
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const appliedDefault = useRef(false);
  const filters = query.data ?? [];
  const effectiveSelectedId = selectedId === undefined && !skipDefault
    ? filters.find((filter) => filter.isDefault)?.id
    : selectedId || undefined;
  const selected = filters.find((filter) => filter.id === effectiveSelectedId);

  useEffect(() => {
    if (appliedDefault.current || query.isLoading) return;
    appliedDefault.current = true;
    if (skipDefault) return;
    const defaultFilter = query.data?.find((filter) => filter.isDefault);
    if (defaultFilter) {
      onApply(defaultFilter.filterParams);
    }
  }, [onApply, query.data, query.isLoading, skipDefault]);

  const save = async () => {
    if (!name.trim()) return;
    try {
      const created = await createMutation.mutateAsync({
        resourceType,
        name: name.trim(),
        filterParams: currentParams,
        isDefault,
      });
      setSelectedId(created.id);
      setSaveOpen(false);
      setName('');
      setIsDefault(false);
      message.success('Đã lưu bộ lọc cá nhân.');
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const updateCurrent = async () => {
    if (!selected) return;
    try {
      await updateMutation.mutateAsync({ filterId: selected.id, payload: { filterParams: currentParams } });
      message.success(`Đã cập nhật “${selected.name}”.`);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const makeDefault = async () => {
    if (!selected) return;
    try {
      await updateMutation.mutateAsync({ filterId: selected.id, payload: { isDefault: true } });
      message.success(`“${selected.name}” sẽ tự áp dụng khi mở màn hình.`);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const remove = () => {
    if (!selected) return;
    modal.confirm({
      title: 'Xóa bộ lọc đã lưu?',
      content: `Bộ lọc “${selected.name}” chỉ bị xóa khỏi tài khoản của bạn.`,
      okText: 'Xóa',
      cancelText: 'Giữ lại',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(selected.id);
          setSelectedId(undefined);
          message.success('Đã xóa bộ lọc.');
        } catch (error) {
          message.error(errorMessage(error));
          throw error;
        }
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex min-w-56 flex-1 items-center gap-2">
        <Bookmark className="h-4 w-4 shrink-0 text-blue-600" />
        <Select
          className="min-w-52 flex-1"
          allowClear
          loading={query.isLoading}
          value={effectiveSelectedId}
          placeholder="Bộ lọc cá nhân đã lưu"
          options={filters.map((filter) => ({
            value: filter.id,
            label: `${filter.isDefault ? '★ ' : ''}${filter.name}`,
          }))}
          onChange={(filterId) => {
            setSelectedId(filterId || null);
            const filter = filters.find((item) => item.id === filterId);
            if (filter) onApply(filter.filterParams);
          }}
        />
      </div>
      <BaseButton type="default" icon={<Save className="h-4 w-4" />} onClick={() => setSaveOpen(true)}>
        Lưu bộ lọc hiện tại
      </BaseButton>
      <Tooltip title="Ghi đè tham số của bộ lọc đang chọn">
        <BaseButton type="text" aria-label="Cập nhật bộ lọc đang chọn" disabled={!selected} loading={updateMutation.isPending} icon={<RefreshCw className="h-4 w-4" />} onClick={() => void updateCurrent()} />
      </Tooltip>
      <Tooltip title="Đặt làm bộ lọc mặc định">
        <BaseButton type="text" aria-label="Đặt bộ lọc mặc định" disabled={!selected || selected.isDefault} icon={<Star className="h-4 w-4" />} onClick={() => void makeDefault()} />
      </Tooltip>
      <Tooltip title="Xóa bộ lọc đang chọn">
        <BaseButton danger type="text" aria-label="Xóa bộ lọc đang chọn" disabled={!selected} icon={<Trash2 className="h-4 w-4" />} onClick={remove} />
      </Tooltip>

      <Modal
        title="Lưu bộ lọc hiện tại"
        open={saveOpen}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={createMutation.isPending}
        okButtonProps={{ disabled: !name.trim() }}
        onCancel={() => setSaveOpen(false)}
        onOk={() => void save()}
      >
        <div className="space-y-4 py-3">
          <div>
            <label htmlFor={`${resourceType}-saved-filter-name`} className="mb-1 block text-sm font-semibold text-slate-700">Tên bộ lọc</label>
            <Input id={`${resourceType}-saved-filter-name`} value={name} maxLength={120} placeholder="Ví dụ: Vi phạm chưa xử lý tháng này" onChange={(event) => setName(event.target.value)} onPressEnter={() => void save()} />
          </div>
          <Checkbox checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)}>
            Tự động áp dụng khi mở màn hình
          </Checkbox>
          <p className="text-xs text-slate-500">Bộ lọc này là dữ liệu cá nhân, người dùng khác trong công ty không nhìn thấy.</p>
        </div>
      </Modal>
    </div>
  );
}
