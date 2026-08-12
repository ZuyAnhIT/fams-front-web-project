"use client";

import { Table, type TableProps } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import EmptyState from "@/components/feedback/EmptyState";

interface DataTableProps<T> extends Omit<TableProps<T>, "pagination"> {
  columns: ColumnsType<T>;
  data: T[];
  loading?: boolean;
  showPagination?: boolean;
  totalElements?: number;
  currentPage?: number; // 0-indexed (backend value)
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  ariaLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  showPagination = true,
  totalElements = 0,
  currentPage = 0,
  pageSize = 10,
  onPageChange,
  ariaLabel = "Bảng dữ liệu",
  emptyTitle,
  emptyDescription,
  locale,
  ...rest
}: DataTableProps<T>) {
  const paginationConfig: TablePaginationConfig | false = showPagination ? {
    placement: ["bottomEnd"],
    current: currentPage + 1, // Ant Design dùng 1-indexed
    pageSize: pageSize,
    total: totalElements,
    showSizeChanger: totalElements > 10,
    pageSizeOptions: [10, 20, 50],
    responsive: true,
    showLessItems: true,
    showTotal: (total, range) => `Hiển thị ${range[0]}–${range[1]} trên ${total}`,
    onChange: (page, size) => {
      if (onPageChange) onPageChange(page - 1, size); // Trả về 0-indexed cho backend
    },
  } : false;

  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <Table
        bordered={false}
        size="middle"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={paginationConfig}
        rowKey="id"
        scroll={{ x: "max-content" }}
        locale={{
          ...locale,
          emptyText: (
            <EmptyState
              compact
              title={emptyTitle}
              description={emptyDescription}
            />
          ),
        }}
        className="[&_.ant-table-thead_th]:!bg-slate-50 [&_.ant-table-thead_th]:!text-slate-600 [&_.ant-table-thead_th]:!font-semibold [&_.ant-table-thead_th]:!text-xs [&_.ant-table-thead_th]:!tracking-wide [&_.ant-table-thead_th]:!py-3.5 [&_.ant-table-thead_th]:!border-b [&_.ant-table-thead_th]:!border-slate-200 [&_.ant-table-thead_th]:!whitespace-nowrap [&_.ant-table-cell]:!py-3.5 [&_.ant-table-cell]:!border-slate-100 [&_.ant-table-tbody_tr:hover_td]:!bg-blue-50/40 [&_.ant-table-pagination]:!px-4 [&_.ant-table-pagination]:!py-3 [&_.ant-table-pagination]:!m-0 [&_.ant-table-pagination]:!border-t [&_.ant-table-pagination]:!border-slate-100"
        {...rest}
      />
    </div>
  );
}
