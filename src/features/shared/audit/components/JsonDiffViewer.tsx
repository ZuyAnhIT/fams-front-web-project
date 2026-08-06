'use client';

import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import DataTable from '@/components/tables/DataTable';
import type { AuditJsonValue } from '../types/audit-log.type';

interface DiffRow {
  id: string;
  field: string;
  before: unknown;
  after: unknown;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
}

function flatten(value: AuditJsonValue | null, prefix = ''): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { [prefix || '(giá trị)']: value };
  }
  const entries = Object.entries(value);
  if (!entries.length) return { [prefix || '(giá trị)']: {} };
  return entries.reduce<Record<string, unknown>>((result, [key, child]) => ({
    ...result,
    ...flatten(child, prefix ? `${prefix}.${key}` : key),
  }), {});
}

function display(value: unknown) {
  if (value === undefined) return '—';
  if (value === null) return 'null';
  if (typeof value === 'string') return value || '""';
  return JSON.stringify(value);
}

export default function JsonDiffViewer({ oldValue, newValue }: { oldValue: AuditJsonValue | null; newValue: AuditJsonValue | null }) {
  const before = flatten(oldValue);
  const after = flatten(newValue);
  const fields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  const rows: DiffRow[] = fields.map((field) => {
    const hasBefore = Object.hasOwn(before, field);
    const hasAfter = Object.hasOwn(after, field);
    const status = !hasBefore ? 'added' : !hasAfter ? 'removed' : JSON.stringify(before[field]) !== JSON.stringify(after[field]) ? 'changed' : 'unchanged';
    return { id: field, field, before: before[field], after: after[field], status };
  });
  const columns: ColumnsType<DiffRow> = [
    { title: 'Trường', dataIndex: 'field', width: 220, render: (value) => <code className="break-all text-xs">{value}</code> },
    { title: 'Trước thay đổi', dataIndex: 'before', render: (value) => <pre className="max-w-md whitespace-pre-wrap break-all text-xs text-red-700">{display(value)}</pre> },
    { title: 'Sau thay đổi', dataIndex: 'after', render: (value) => <pre className="max-w-md whitespace-pre-wrap break-all text-xs text-emerald-700">{display(value)}</pre> },
    { title: 'Kết quả', dataIndex: 'status', width: 120, render: (status: DiffRow['status']) => {
      const meta = {
        added: { color: 'success', label: 'Thêm' },
        removed: { color: 'error', label: 'Xóa' },
        changed: { color: 'warning', label: 'Thay đổi' },
        unchanged: { color: 'default', label: 'Không đổi' },
      }[status];
      return <Tag color={meta.color}>{meta.label}</Tag>;
    } },
  ];

  return <DataTable ariaLabel="So sánh dữ liệu audit trước và sau" columns={columns} data={rows} showPagination={false} scroll={{ x: 900 }} />;
}
