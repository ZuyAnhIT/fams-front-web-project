"use client";

import { useEffect, useMemo } from "react";
import { Alert, Image, Spin } from "antd";
import BaseModal from "@/components/ui/BaseModal";
import { useScheduledCheckPhoto } from "../hooks/use-scheduled-check";

interface Props {
  tenantId: string;
  checkId: string | null;
  employeeName?: string;
  open: boolean;
  onClose: () => void;
}

export default function RandomCheckEvidencePhotoModal({
  tenantId,
  checkId,
  employeeName,
  open,
  onClose,
}: Props) {
  const photo = useScheduledCheckPhoto(tenantId, checkId, open);
  const photoUrl = useMemo(
    () => (photo.data ? URL.createObjectURL(photo.data) : null),
    [photo.data],
  );

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  return (
    <BaseModal
      title="Ảnh selfie bằng chứng"
      isOpen={open}
      onClose={onClose}
      hideFooter
      width={680}
    >
      <div className="space-y-4">
        <Alert
          type="warning"
          showIcon
          title="Dữ liệu sinh trắc học nhạy cảm"
          description="Chỉ sử dụng ảnh để xử lý kiểm tra hoặc tranh chấp hợp lệ. Mỗi lần tải ảnh vẫn được Backend kiểm tra lại quyền và phạm vi công trình."
        />
        {photo.isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spin size="large" tip="Đang tải ảnh có xác thực..." />
          </div>
        ) : photo.isError || !photoUrl ? (
          <Alert
            type="error"
            showIcon
            title="Không thể tải ảnh bằng chứng"
            description="Ảnh có thể đã bị xóa theo chính sách lưu trữ, không còn tồn tại hoặc bạn không còn quyền xem công trình này."
          />
        ) : (
          <div className="flex justify-center rounded-xl bg-slate-950 p-3">
            <Image
              src={photoUrl}
              alt={`Ảnh selfie Random Check${employeeName ? ` của ${employeeName}` : ""}`}
              className="max-h-[58vh] rounded-lg object-contain"
              preview={{ mask: "Xem kích thước lớn" }}
            />
          </div>
        )}
      </div>
    </BaseModal>
  );
}
