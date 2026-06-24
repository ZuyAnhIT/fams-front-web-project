"use client";

import { Table, type TableProps } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

interface DataTableProps<T> extends Omit<TableProps<T>, "pagination"> {
  columns: ColumnsType<T>;
  data: T[];
  loading?: boolean;
  totalElements: number;
  currentPage: number; // 0-indexed (backend value)
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

export default function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  totalElements,
  currentPage,
  pageSize,
  onPageChange,
  ...rest
}: DataTableProps<T>) {
  const paginationConfig: TablePaginationConfig = {
    current: currentPage + 1, // Ant Design dùng 1-indexed
    pageSize: pageSize,
    total: totalElements,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} bản ghi`,
    onChange: (page, size) => {
      onPageChange(page - 1, size); // Trả về 0-indexed cho backend
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-brand-200/60 overflow-hidden">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={paginationConfig}
        rowKey="id"
        scroll={{ x: "max-content" }}
        className="[&_.ant-table-thead_th]:!bg-brand-50 [&_.ant-table-thead_th]:!text-brand-900 [&_.ant-table-thead_th]:!font-semibold"
        {...rest}
      />
    </div>
  );
}
