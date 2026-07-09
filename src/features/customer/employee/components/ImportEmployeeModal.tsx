import { Modal, message, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useState } from "react";
import BaseModal from "@/components/ui/BaseModal";
import { useImportEmployees } from "../hooks/use-employee";

const { Dragger } = Upload;

interface ImportEmployeeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportEmployeeModal({ open, onClose }: ImportEmployeeModalProps) {
  const { mutateAsync: importEmployees, isPending } = useImportEmployees();
  const [file, setFile] = useState<File | null>(null);

  const handleImport = async () => {
    if (!file) {
      message.error("Vui lòng chọn file Excel để tải lên.");
      return;
    }
    try {
      await importEmployees(file);
      message.success("Import nhân viên thành công.");
      setFile(null);
      onClose();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Lỗi khi import dữ liệu.");
    }
  };

  const uploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx, .xls",
    beforeUpload: (file: File) => {
      setFile(file);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFile(null);
    },
    fileList: file ? [file as any] : [],
  };

  return (
    <BaseModal
      title="Import danh sách nhân viên"
      isOpen={open}
      onClose={onClose}
      onConfirm={handleImport}
      confirmLoading={isPending}
      confirmText="Xác nhận Import"
    >
      <div className="mt-4">
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Nhấp hoặc kéo thả file Excel vào đây để upload</p>
          <p className="ant-upload-hint">Chỉ hỗ trợ file định dạng .xlsx, .xls.</p>
        </Dragger>
      </div>
    </BaseModal>
  );
}
