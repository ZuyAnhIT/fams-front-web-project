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
    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={paginationConfig}
        rowKey="id"
        scroll={{ x: "max-content" }}
        className="[&_.ant-table-wrapper]:!border-0 [&_.ant-table-thead_th]:!bg-transparent [&_.ant-table-thead_th]:!text-slate-700 [&_.ant-table-thead_th]:!font-extrabold [&_.ant-table-thead_th]:!uppercase [&_.ant-table-thead_th]:!text-[13px] [&_.ant-table-thead_th]:!tracking-[0.05em] [&_.ant-table-thead_th]:!py-5 [&_.ant-table-thead_th]:!border-b-[1.5px] [&_.ant-table-thead_th]:!border-slate-200 [&_.ant-table-thead_th]:!whitespace-nowrap [&_.ant-table-cell]:!py-5 [&_.ant-table-cell]:!border-b [&_.ant-table-cell]:!border-slate-50 [&_.ant-table-tbody_tr:hover_td]:!bg-blue-50/40 [&_.ant-table-tbody_tr:last-child_td]:!border-b-0"
        {...rest}
      />
    </div>
  );
}
