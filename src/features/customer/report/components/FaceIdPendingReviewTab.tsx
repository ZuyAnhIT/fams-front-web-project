"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Image,
  Skeleton,
  Tag,
  Tooltip,
  type TableColumnsType,
} from "antd";
import { Check, RefreshCcw, Search, X } from "lucide-react";
import { isAxiosError } from "axios";
import BaseButton from "@/components/ui/BaseButton";
import BaseInput from "@/components/ui/BaseInput";
import BaseModal from "@/components/ui/BaseModal";
import BaseTextArea from "@/components/ui/BaseTextArea";
import DataTable from "@/components/tables/DataTable";
import {
  useApproveFaceIdEnrollment,
  usePendingFaceIdReviewPhoto,
  usePendingFaceIdReviews,
  useRejectFaceIdEnrollment,
} from "../hooks/use-face-id-report";
import type { FaceIdReviewItem } from "../types/face-id-report.type";

function backendErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  return (
    (error.response?.data as { message?: string } | undefined)?.message ||
    fallback
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PendingReviewPhoto({
  employeeId,
  employeeName,
}: {
  employeeId: string;
  employeeName: string;
}) {
  const { data, isLoading, isError } = usePendingFaceIdReviewPhoto(employeeId);
  const photoUrl = useMemo(
    () => (data ? URL.createObjectURL(data) : null),
    [data],
  );

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  if (isLoading) {
    return <Skeleton.Image active className="!h-16 !w-16" />;
  }
  if (isError || !photoUrl) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 px-1 text-center text-[10px] text-slate-500">
        Không tải được ảnh
      </div>
    );
  }
  return (
    <Image
      src={photoUrl}
      alt={`Ảnh Face ID chờ duyệt của ${employeeName}`}
      width={64}
      height={64}
      className="rounded-lg object-cover"
      preview={{ mask: "Xem lớn" }}
    />
  );
}

function PendingReviewActions({
  record,
  approving,
  onApprove,
  onReject,
}: {
  record: FaceIdReviewItem;
  approving: boolean;
  onApprove: (record: FaceIdReviewItem) => void;
  onReject: (record: FaceIdReviewItem) => void;
}) {
  const { data: reviewPhoto, isLoading, isError } =
    usePendingFaceIdReviewPhoto(record.employeeId);
  const approveDisabled = isLoading || isError || !reviewPhoto;

  return (
    <div className="flex gap-2">
      <Tooltip
        title={
          approveDisabled
            ? "Phải tải được ảnh đối chiếu trước khi duyệt"
            : "Ảnh đã sẵn sàng để đối chiếu"
        }
      >
        <span>
          <BaseButton
            type="primary"
            size="small"
            icon={<Check className="h-4 w-4" />}
            loading={approving}
            disabled={approveDisabled}
            onClick={() => onApprove(record)}
          >
            Duyệt
          </BaseButton>
        </span>
      </Tooltip>
      <BaseButton
        danger
        size="small"
        icon={<X className="h-4 w-4" />}
        onClick={() => onReject(record)}
      >
        Từ chối
      </BaseButton>
    </div>
  );
}

interface FaceIdPendingReviewTabProps {
  enabled?: boolean;
}

export default function FaceIdPendingReviewTab({
  enabled = true,
}: FaceIdPendingReviewTabProps) {
  const { message, modal } = App.useApp();
  const [search, setSearch] = useState("");
  const [rejecting, setRejecting] = useState<FaceIdReviewItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { data = [], isLoading, isFetching, refetch } =
    usePendingFaceIdReviews(enabled);
  const approve = useApproveFaceIdEnrollment();
  const reject = useRejectFaceIdEnrollment();

  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    if (!query) return data;
    return data.filter((item) =>
      [item.employeeName, item.employeeCode]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("vi").includes(query)),
    );
  }, [data, search]);

  const handleApprove = (record: FaceIdReviewItem) => {
    modal.confirm({
      title: `Duyệt Face ID của ${record.employeeName}?`,
      content:
        "Ảnh mới sẽ trở thành mẫu Face ID đang dùng để xác thực chấm công. Chỉ duyệt sau khi đã xác minh đúng người.",
      okText: "Duyệt hồ sơ",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await approve.mutateAsync(record.employeeId);
          message.success(`Đã duyệt Face ID của ${record.employeeName}`);
        } catch (error: unknown) {
          message.error(
            backendErrorMessage(error, "Không thể duyệt hồ sơ Face ID"),
          );
          throw error;
        }
      },
    });
  };

  const handleReject = async () => {
    if (!rejecting) return;
    const reason = rejectReason.trim();
    if (!reason) {
      message.warning("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await reject.mutateAsync({
        employeeId: rejecting.employeeId,
        reason,
      });
      message.success(`Đã từ chối Face ID của ${rejecting.employeeName}`);
      setRejecting(null);
      setRejectReason("");
    } catch (error: unknown) {
      message.error(
        backendErrorMessage(error, "Không thể từ chối hồ sơ Face ID"),
      );
    }
  };

  const columns: TableColumnsType<FaceIdReviewItem> = [
    {
      title: "Ảnh đối chiếu",
      key: "reviewPhoto",
      width: 110,
      render: (_, record) => (
        <PendingReviewPhoto
          employeeId={record.employeeId}
          employeeName={record.employeeName}
        />
      ),
    },
    {
      title: "Nhân viên",
      key: "employee",
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-800">
            {record.employeeName}
          </div>
          <div className="text-xs text-slate-500">
            {record.employeeCode || "Chưa có mã nhân viên"}
          </div>
        </div>
      ),
    },
    {
      title: "Loại yêu cầu",
      key: "submissionType",
      width: 160,
      render: (_, record) => (
        <Tag color={record.status === "enrolled" ? "blue" : "processing"}>
          {record.status === "enrolled" ? "Đăng ký lại" : "Đăng ký mới"}
        </Tag>
      ),
    },
    {
      title: "Ảnh đã nộp",
      dataIndex: "pendingPhotoCount",
      key: "pendingPhotoCount",
      width: 120,
      render: (count: number | null) =>
        count == null ? "—" : `${count} khung hình`,
    },
    {
      title: "Gửi lúc",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 170,
      render: (value: string | null) => formatDate(value),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 190,
      render: (_, record) => (
        <PendingReviewActions
          record={record}
          approving={
            approve.isPending && approve.variables === record.employeeId
          }
          onApprove={handleApprove}
          onReject={(item) => {
            setRejecting(item);
            setRejectReason("");
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        message="Đối chiếu ảnh trước khi quyết định"
        description="Bấm vào ảnh để xem lớn và xác minh đúng nhân viên. Ảnh tạm sẽ bị Backend xóa ngay sau khi duyệt hoặc từ chối."
      />

      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <BaseInput
          aria-label="Tìm hồ sơ Face ID chờ duyệt"
          prefix={<Search className="h-4 w-4 text-slate-400" />}
          placeholder="Tìm theo tên hoặc mã nhân viên..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-md"
        />
        <BaseButton
          icon={
            <RefreshCcw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          }
          loading={isFetching}
          onClick={() => refetch()}
        >
          Tải lại
        </BaseButton>
      </div>

      <DataTable
        ariaLabel="Hàng đợi duyệt Face ID"
        rowKey="employeeId"
        data={rows}
        columns={columns}
        loading={isLoading}
        showPagination={false}
        emptyTitle="Không có hồ sơ chờ duyệt"
        emptyDescription="Các lượt đăng ký mới sẽ xuất hiện tại đây sau khi hoàn thành liveness."
      />

      <BaseModal
        title={`Từ chối Face ID${rejecting ? ` — ${rejecting.employeeName}` : ""}`}
        isOpen={Boolean(rejecting)}
        onClose={() => {
          setRejecting(null);
          setRejectReason("");
        }}
        confirmText="Xác nhận từ chối"
        cancelText="Hủy"
        confirmLoading={reject.isPending}
        onConfirm={handleReject}
        confirmButtonProps={{ danger: true }}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Lý do sẽ được hiển thị cho nhân viên để họ biết cách đăng ký lại.
          </p>
          <BaseTextArea
            aria-label="Lý do từ chối Face ID"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={4}
            maxLength={500}
            showCount
            placeholder="Ví dụ: khuôn mặt bị che, ánh sáng quá tối hoặc không xác minh được đúng nhân viên..."
          />
        </div>
      </BaseModal>
    </div>
  );
}
