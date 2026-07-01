import { Modal, message, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useState } from "react";
import BaseButton from "@/components/ui/BaseButton";
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
    <Modal
      title="Import danh sách nhân viên"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <div className="mt-4">
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Nhấp hoặc kéo thả file Excel vào đây để upload</p>
          <p className="ant-upload-hint">Chỉ hỗ trợ file định dạng .xlsx, .xls.</p>
        </Dragger>

        <div className="flex justify-end gap-3 mt-6">
          <BaseButton type="default" onClick={onClose}>
            Hủy
          </BaseButton>
          <BaseButton type="primary" onClick={handleImport} loading={isPending}>
            Xác nhận Import
          </BaseButton>
        </div>
      </div>
    </Modal>
  );
}
