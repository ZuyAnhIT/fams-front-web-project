import { Alert, message, Table, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useState } from "react";
import BaseModal from "@/components/ui/BaseModal";
import { useImportEmployees } from "../hooks/use-employee";
import type { EmployeeImportResult } from "../types/employee.type";

const { Dragger } = Upload;

interface ImportEmployeeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportEmployeeModal({ open, onClose }: ImportEmployeeModalProps) {
  const { mutateAsync: importEmployees, isPending } = useImportEmployees();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<EmployeeImportResult | null>(null);

  const handleImport = async () => {
    if (!file) {
      message.error("Vui lòng chọn file Excel để tải lên.");
      return;
    }
    try {
      const imported = await importEmployees(file);
      setResult(imported);
      if (imported.failedCount === 0) {
        message.success(`Đã tạo ${imported.successCount} hồ sơ nhân viên.`);
      } else {
        message.warning(
          `Đã tạo ${imported.successCount}/${imported.totalRows} hồ sơ; ${imported.failedCount} dòng lỗi.`,
        );
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Lỗi khi import dữ liệu.");
    }
  };

  const uploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx",
    beforeUpload: (file: File) => {
      setResult(null);
      setFile(file);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFile(null);
      setResult(null);
    },
    fileList: file ? [file as any] : [],
  };

  return (
    <BaseModal
      title="Import danh sách nhân viên"
      isOpen={open}
      onClose={() => {
        setFile(null);
        setResult(null);
        onClose();
      }}
      onConfirm={handleImport}
      confirmLoading={isPending}
      confirmText={result ? "Import lại" : "Xác nhận import"}
    >
      <div className="mt-4">
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message="Import chỉ tạo hồ sơ nhân sự, không tạo tài khoản và không gửi email"
          description="Sau khi import, dùng “Mời tham gia” cho những người cần đăng nhập Web/App. Hai luồng được tách riêng để tránh gửi nhầm email hàng loạt."
        />
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Nhấp hoặc kéo thả file Excel vào đây để upload</p>
          <p className="ant-upload-hint">Chỉ hỗ trợ file .xlsx, tối đa 5 MB.</p>
        </Dragger>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Cột hỗ trợ: firstName, lastName, email, phone, employeeCode,
          position, department, hiredDate.
        </p>
        {result && (
          <div className="mt-4 space-y-3">
            <Alert
              showIcon
              type={result.failedCount ? "warning" : "success"}
              message={`Kết quả: ${result.successCount} thành công, ${result.failedCount} lỗi / ${result.totalRows} dòng`}
            />
            {result.errors.length > 0 && (
              <Table
                size="small"
                pagination={{ pageSize: 5, hideOnSinglePage: true }}
                rowKey={(row) => `${row.row}-${row.field}-${row.message}`}
                dataSource={result.errors}
                columns={[
                  { title: "Dòng", dataIndex: "row", width: 70 },
                  { title: "Cột", dataIndex: "field", width: 120, render: (value) => value || "—" },
                  { title: "Lỗi", dataIndex: "message" },
                ]}
              />
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
