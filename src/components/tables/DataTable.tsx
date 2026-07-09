"use client";

import { Table, type TableProps } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

interface DataTableProps<T> extends Omit<TableProps<T>, "pagination"> {
  columns: ColumnsType<T>;
  data: T[];
  loading?: boolean;
  showPagination?: boolean;
  totalElements?: number;
  currentPage?: number; // 0-indexed (backend value)
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
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
  ...rest
}: DataTableProps<T>) {
  const paginationConfig: TablePaginationConfig | false = showPagination ? {
    position: ["bottomCenter"],
    current: currentPage + 1, // Ant Design dùng 1-indexed
    pageSize: pageSize,
    total: totalElements,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} bản ghi`,
    onChange: (page, size) => {
      if (onPageChange) onPageChange(page - 1, size); // Trả về 0-indexed cho backend
    },
  } : false;

  return (
    <div className="w-full overflow-hidden border border-slate-300 rounded-[5px] bg-white shadow-sm">
      <Table
        bordered
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={paginationConfig}
        rowKey="id"
        scroll={{ x: "max-content" }}
        className="[&_.ant-table-wrapper]:!border-0 [&_.ant-table-container]:!border-t-0 [&_.ant-table-container]:!border-l-0 [&_.ant-table-thead_th]:!bg-gray-100 [&_.ant-table-thead_th]:!text-slate-700 [&_.ant-table-thead_th]:!font-bold [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!text-[14px] [&_.ant-table-thead_th]:!tracking-[0.05em] [&_.ant-table-thead_th]:!py-5 [&_.ant-table-thead_th]:!border-b-[1.5px] [&_.ant-table-thead_th]:!border-slate-300 [&_.ant-table-thead_th]:!whitespace-nowrap [&_.ant-table-cell]:!py-5 [&_.ant-table-cell]:!border-slate-300 [&_.ant-table-tbody_tr:hover_td]:!bg-blue-50/40 [&_.ant-table-cell:last-child]:!border-r-0 [&_.ant-table-pagination]:!bg-gray-100 [&_.ant-table-pagination]:!border-t [&_.ant-table-pagination]:!border-slate-300 [&_.ant-table-pagination]:!px-5 [&_.ant-table-pagination]:!py-4 [&_.ant-table-pagination]:!m-0"
        {...rest}
      />
    </div>
  );
}
