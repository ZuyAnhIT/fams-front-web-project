import { Alert, App, Table, Upload, type UploadProps } from "antd";
import {
  DownloadOutlined,
  FileExcelOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import BaseModal from "@/components/ui/BaseModal";
import BaseButton from "@/components/ui/BaseButton";
import {
  useDownloadEmployeeImportTemplate,
  useExportImportErrors,
  useImportEmployees,
  useValidateEmployeeImport,
} from "../hooks/use-employee";
import type {
  EmployeeImportError,
  EmployeeImportResult,
  EmployeeImportValidationResult,
} from "../types/employee.type";
import { getApiErrorMessage } from "@/utils/api-error.util";
import { downloadBlob } from "@/features/customer/report/components/report-utils";

const { Dragger } = Upload;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const FIELD_LABELS: Record<string, string> = {
  employeeCode: "Mã nhân viên",
  employeecode: "Mã nhân viên",
  lastName: "Họ và tên đệm",
  lastname: "Họ và tên đệm",
  firstName: "Tên",
  firstname: "Tên",
  email: "Email",
  phone: "Số điện thoại",
  position: "Chức vụ",
  department: "Phòng ban",
  hiredDate: "Ngày vào làm",
  hireddate: "Ngày vào làm",
  header: "Dòng tiêu đề",
  file: "File Excel",
};

interface ImportEmployeeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportEmployeeModal({ open, onClose }: ImportEmployeeModalProps) {
  const { message } = App.useApp();
  const { mutateAsync: importEmployees, isPending } = useImportEmployees();
  const { mutateAsync: validateImport, isPending: isValidating } = useValidateEmployeeImport();
  const { mutateAsync: downloadTemplate, isPending: isDownloadingTemplate } =
    useDownloadEmployeeImportTemplate();
  const { mutateAsync: exportImportErrors, isPending: isExportingErrors } = useExportImportErrors();
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<EmployeeImportValidationResult | null>(null);
  const [result, setResult] = useState<EmployeeImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setValidation(null);
    setResult(null);
  };

  const handleValidate = async () => {
    if (!file) {
      message.error("Vui lòng chọn file Excel để kiểm tra.");
      return;
    }
    try {
      const checked = await validateImport(file);
      setValidation(checked);
      setResult(null);
      if (checked.valid) {
        message.success(`Dữ liệu hợp lệ: ${checked.validRows} dòng sẵn sàng import.`);
      } else {
        message.warning(`Phát hiện ${checked.errors.length} lỗi cần sửa trước khi import.`);
      }
    } catch (error: unknown) {
      setValidation(null);
      message.error(getApiErrorMessage(error, "Không thể kiểm tra file Excel."));
    }
  };

  const handleImport = async () => {
    if (!file || !validation?.valid) {
      message.error("Vui lòng kiểm tra và sửa hết lỗi dữ liệu trước khi import.");
      return;
    }
    try {
      const imported = await importEmployees(file);
      setResult(imported);
      if (imported.failedCount === 0) {
        message.success(`Đã tạo ${imported.successCount} hồ sơ nhân viên.`);
      } else {
        setValidation({
          valid: false,
          totalRows: imported.totalRows,
          validRows: imported.successCount,
          invalidRows: imported.failedCount,
          errors: imported.errors,
        });
        message.warning(
          `Dữ liệu đã thay đổi: tạo ${imported.successCount}/${imported.totalRows} hồ sơ; ${imported.failedCount} dòng lỗi.`,
        );
      }
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Lỗi khi import dữ liệu."));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadTemplate();
      downloadBlob(blob, "mau-import-nhan-vien.xlsx");
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Không thể tải file mẫu."));
    }
  };

  const handleDownloadErrors = async () => {
    if (!file) return;
    try {
      const blob = await exportImportErrors(file);
      downloadBlob(blob, "danh-sach-nhan-vien-can-sua.xlsx");
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Lỗi khi tải file tổng hợp lỗi."));
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx",
    beforeUpload: (selectedFile) => {
      if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
        message.error("Chỉ hỗ trợ file Excel định dạng .xlsx.");
        return Upload.LIST_IGNORE;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        message.error("File Excel không được vượt quá 5 MB.");
        return Upload.LIST_IGNORE;
      }
      setValidation(null);
      setResult(null);
      setFile(selectedFile);
      return false;
    },
    onRemove: reset,
    fileList: file ? [{
      uid: `${file.name}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "done",
    }] : [],
  };

  const displayedErrors: EmployeeImportError[] = result?.errors.length
    ? result.errors
    : validation?.errors ?? [];
  const validationTitle = validation?.valid
    ? `${validation.validRows}/${validation.totalRows} dòng hợp lệ — có thể import`
    : validation?.totalRows === 0
      ? "File chưa sẵn sàng import — cần sửa cấu trúc hoặc bổ sung dữ liệu"
      : `${validation?.invalidRows}/${validation?.totalRows} dòng cần sửa`;

  return (
    <BaseModal
      title="Import danh sách nhân viên"
      isOpen={open}
      width={760}
      onClose={() => {
        reset();
        onClose();
      }}
      onConfirm={handleImport}
      confirmLoading={isPending}
      confirmText={result?.failedCount === 0 ? "Đã import" : "Xác nhận import"}
      confirmButtonProps={{
        disabled: !validation?.valid || isValidating || result?.failedCount === 0,
      }}
    >
      <div className="mt-4 space-y-4">
        <Alert
          type="info"
          showIcon
          title="Import chỉ tạo hồ sơ nhân sự, không tạo tài khoản và không gửi email"
          description="Tải file mẫu, điền đúng cấu trúc rồi kiểm tra dữ liệu trước khi import. Sau đó dùng “Mời tham gia” cho người cần đăng nhập Web/App."
        />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div>
            <div className="font-semibold text-slate-800">Bước 1 — Tải file Excel mẫu tiếng Việt</div>
            <div className="mt-1 text-xs text-slate-600">Có sẵn trang hướng dẫn, cột bắt buộc, định dạng và ví dụ.</div>
          </div>
          <BaseButton
            icon={<FileExcelOutlined />}
            loading={isDownloadingTemplate}
            onClick={handleDownloadTemplate}
          >
            Tải file mẫu
          </BaseButton>
        </div>

        <div>
          <div className="mb-2 font-semibold text-slate-800">Bước 2 — Chọn file đã điền</div>
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Nhấp hoặc kéo thả file Excel vào đây</p>
            <p className="ant-upload-hint">Chỉ hỗ trợ .xlsx, tối đa 5 MB.</p>
          </Dragger>
        </div>

        {file && !result && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
            <div>
              <div className="font-semibold text-slate-800">Bước 3 — Kiểm tra trước khi import</div>
              <div className="mt-1 text-xs text-slate-500">Bước này không tạo hoặc thay đổi dữ liệu nhân viên.</div>
            </div>
            <BaseButton
              type="primary"
              icon={<SafetyCertificateOutlined />}
              loading={isValidating}
              onClick={handleValidate}
            >
              Kiểm tra dữ liệu
            </BaseButton>
          </div>
        )}

        {validation && (
          <div className="space-y-3">
            <Alert
              showIcon
              type={validation.valid ? "success" : "warning"}
              title={validationTitle}
              description={validation.valid
                ? "Nút “Xác nhận import” đã được mở."
                : "Sửa các lỗi bên dưới rồi chọn lại file và kiểm tra lần nữa."}
            />
            {!validation.valid && file && (
              <BaseButton
                icon={<DownloadOutlined />}
                loading={isExportingErrors}
                onClick={handleDownloadErrors}
              >
                Tải danh sách dòng cần sửa
              </BaseButton>
            )}
          </div>
        )}

        {result?.failedCount === 0 && (
          <Alert
            showIcon
            type="success"
            title={`Hoàn tất: đã tạo ${result.successCount} hồ sơ nhân viên`}
            description="Đóng cửa sổ để xem danh sách nhân viên vừa cập nhật."
          />
        )}

        {displayedErrors.length > 0 && (
          <Table
            size="small"
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            rowKey={(row) => `${row.row}-${row.field}-${row.message}`}
            dataSource={displayedErrors}
            columns={[
              { title: "Dòng Excel", dataIndex: "row", width: 105 },
              {
                title: "Trường dữ liệu",
                dataIndex: "field",
                width: 160,
                render: (value?: string) => value ? FIELD_LABELS[value] ?? value : "—",
              },
              { title: "Nội dung cần sửa", dataIndex: "message" },
            ]}
          />
        )}
      </div>
    </BaseModal>
  );
}
