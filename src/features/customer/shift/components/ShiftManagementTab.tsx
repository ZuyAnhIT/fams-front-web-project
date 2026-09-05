import React, { useState } from "react";
import {
  App,
  Badge,
  Tag,
  Tooltip,
  type TableColumnsType,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { isAxiosError } from "axios";
import { BaseButton, BaseInput, BaseSelect } from "@/components/ui";
import DataTable from "@/components/tables/DataTable";
import {
  useDeleteShiftMutation,
  useShiftsQuery,
  useUpdateShiftMutation,
} from "../hooks/use-shift";
import type { ShiftResponse } from "../types/shift.type";
import ShiftFormModal from "./ShiftFormModal";
import ShiftOtConfigModal from "./ShiftOtConfigModal";
import { useAuthStore } from "@/stores/auth.store";
import {
  CHECKIN_POLICY_META,
  normalizeCheckinPolicy,
} from "../../checkin/constants/checkin-policy";

interface ShiftManagementTabProps {
  tenantId?: string;
  siteId: string;
}

function backendErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  return (
    (error.response?.data as { message?: string } | undefined)?.message ||
    fallback
  );
}

export default function ShiftManagementTab({
  tenantId,
  siteId,
}: ShiftManagementTabProps) {
  const { message, modal } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission("shifts:create");
  const canUpdate = hasPermission("shifts:update");
  const canDelete = hasPermission("shifts:delete");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<"active" | "inactive" | undefined>();
  const [search, setSearch] = useState("");
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isOtModalOpen, setIsOtModalOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<ShiftResponse | null>(null);

  const updateShift = useUpdateShiftMutation();
  const deleteShift = useDeleteShiftMutation();
  const { data, isLoading } = useShiftsQuery(tenantId, siteId, {
    page,
    size: pageSize,
    status,
    search: search.trim() || undefined,
  });

  const shifts = data?.content ?? [];
  const totalShifts = data?.totalElements ?? 0;

  const toggleStatus = (shift: ShiftResponse) => {
    if (!tenantId) return;
    const nextStatus = shift.status === "active" ? "inactive" : "active";
    const deactivate = nextStatus === "inactive";
    modal.confirm({
      title: deactivate
        ? `Ngừng dùng ca “${shift.name}”?`
        : `Kích hoạt lại ca “${shift.name}”?`,
      content: deactivate
        ? "Ca sẽ không còn xuất hiện khi tạo phân công mới. Các phân công và lịch sử cũ vẫn được giữ nguyên."
        : "Ca sẽ xuất hiện lại trong danh sách lựa chọn khi tạo hoặc sửa phân công.",
      okText: deactivate ? "Ngừng dùng" : "Kích hoạt",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await updateShift.mutateAsync({
            tenantId,
            siteId,
            shiftId: shift.id,
            data: { status: nextStatus },
          });
          message.success(
            deactivate ? "Đã ngừng dùng ca" : "Đã kích hoạt lại ca",
          );
        } catch (error) {
          message.error(
            backendErrorMessage(error, "Không thể cập nhật trạng thái ca"),
          );
          throw error;
        }
      },
    });
  };

  const removeShift = (shift: ShiftResponse) => {
    if (!tenantId || !shift.canDelete) return;
    modal.confirm({
      title: `Xóa ca “${shift.name}”?`,
      content:
        "Chỉ ca chưa từng được dùng trong bất kỳ phân công nào mới có thể xóa. Nếu đã có lịch sử, hãy dùng “Ngừng dùng”.",
      okText: "Xóa ca",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteShift.mutateAsync({
            tenantId,
            siteId,
            shiftId: shift.id,
          });
          message.success("Đã xóa ca chưa sử dụng");
        } catch (error) {
          message.error({
            content: backendErrorMessage(
              error,
              "Không thể xóa ca. Nếu ca đã có lịch sử phân công, hãy ngừng dùng ca thay vì xóa.",
            ),
            duration: 7,
          });
          throw error;
        }
      },
    });
  };

  const columns: TableColumnsType<ShiftResponse> = [
    {
      title: "Tên ca",
      dataIndex: "name",
      key: "name",
      className: "font-medium text-slate-700",
      render: (value: string, shift) => (
        <span className="flex items-center gap-2">
          {value}
          {shift.isDefault && <Tag color="gold">Mặc định</Tag>}
        </span>
      ),
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_, shift) => (
        <span className="text-slate-600">
          {shift.startTime} – {shift.endTime}
        </span>
      ),
    },
    {
      title: "Qua đêm",
      dataIndex: "allowOvernight",
      key: "allowOvernight",
      render: (value: boolean) =>
        value ? <Tag color="blue">Có</Tag> : <Tag>Không</Tag>,
    },
    {
      title: "Chính sách chấm công",
      key: "attendancePolicy",
      render: (_, shift) => (
        <div className="space-y-1 text-xs text-slate-600">
          <div>
            OT:{" "}
            <Tag color={shift.allowOvertime ? "green" : "default"}>
              {shift.allowOvertime ? "Cho phép" : "Không"}
            </Tag>
          </div>
          <div>
            Sớm {shift.earlyCheckinMinutes} phút · muộn{" "}
            {shift.lateCheckoutMinutes} phút · ân hạn {shift.graceMinutes} phút
          </div>
          <div>
            Cảnh báo OT: {shift.maxOtMinutesPerDay == null ? "không giới hạn ngày" : `${shift.maxOtMinutesPerDay} phút/ngày`}
            {" · "}
            {shift.maxOtMinutesPerWeek == null ? "không giới hạn tuần" : `${shift.maxOtMinutesPerWeek} phút/tuần`}
          </div>
          <div>
            {shift.checkinPolicyOverride ? (
              <Tooltip title="Ca này không kế thừa chính sách mặc định của công trình">
                <Tag
                  color={
                    CHECKIN_POLICY_META[
                      normalizeCheckinPolicy(shift.checkinPolicyOverride)
                    ].color
                  }
                >
                  Ghi đè:{" "}
                  {
                    CHECKIN_POLICY_META[
                      normalizeCheckinPolicy(shift.checkinPolicyOverride)
                    ].shortLabel
                  }
                </Tag>
              </Tooltip>
            ) : (
              <Tag>Kế thừa công trình</Tag>
            )}
          </div>
          <div>
            Kiểm tra tự động:{" "}
            <Tag color={shift.randomCheckPolicy === "disabled" ? "default" : shift.randomCheckPolicy === "enabled" ? "green" : "blue"}>
              {shift.randomCheckPolicy === "disabled" ? "Tắt" : shift.randomCheckPolicy === "enabled" ? "Bật riêng" : "Kế thừa"}
            </Tag>
          </div>
          <div>
            Kiểm tra thủ công:{" "}
            <Tag color={shift.manualCheckPolicy === "disabled" ? "default" : shift.manualCheckPolicy === "enabled" ? "green" : "blue"}>
              {shift.manualCheckPolicy === "disabled" ? "Tắt" : shift.manualCheckPolicy === "enabled" ? "Cho phép riêng" : "Kế thừa"}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value: ShiftResponse["status"]) => (
        <Badge
          status={value === "active" ? "success" : "default"}
          text={value === "active" ? "Đang áp dụng" : "Ngừng áp dụng"}
        />
      ),
    },
    ...((canUpdate || canDelete)
      ? [
          {
            title: "Thao tác",
            key: "action",
            width: 190,
            render: (_: unknown, shift: ShiftResponse) => (
              <div className="flex gap-1">
                {canUpdate && (
                  <>
                    <BaseButton
                      aria-label={`Sửa ca ${shift.name}`}
                      type="text"
                      size="small"
                      icon={<EditOutlined className="text-blue-500" />}
                      onClick={() => {
                        setActiveShift(shift);
                        setIsShiftModalOpen(true);
                      }}
                      title="Sửa ca làm việc"
                    />
                    <BaseButton
                      aria-label={`Cấu hình OT ca ${shift.name}`}
                      type="text"
                      size="small"
                      icon={<SettingOutlined className="text-purple-500" />}
                      onClick={() => {
                        setActiveShift(shift);
                        setIsOtModalOpen(true);
                      }}
                      title="Cấu hình OT và giới hạn giờ"
                    />
                    <BaseButton
                      aria-label={
                        shift.status === "active"
                          ? `Ngừng dùng ca ${shift.name}`
                          : `Kích hoạt lại ca ${shift.name}`
                      }
                      type="text"
                      size="small"
                      icon={
                        shift.status === "active" ? (
                          <PauseCircleOutlined className="text-amber-500" />
                        ) : (
                          <ReloadOutlined className="text-emerald-500" />
                        )
                      }
                      onClick={() => toggleStatus(shift)}
                      title={
                        shift.status === "active"
                          ? "Ngừng dùng nhưng giữ lịch sử"
                          : "Kích hoạt lại ca"
                      }
                    />
                  </>
                )}
                {canDelete && (
                  <Tooltip
                    title={
                      shift.canDelete
                        ? "Xóa ca tạo nhầm và chưa từng sử dụng"
                        : `Không thể xóa: ca này đã có ${shift.assignmentHistoryCount} lượt phân công. Dùng “Ngừng dùng” để giữ lại lịch sử.`
                    }
                  >
                    <span>
                      <BaseButton
                        aria-label={`Xóa ca ${shift.name}`}
                        type="text"
                        size="small"
                        danger
                        disabled={!shift.canDelete}
                        icon={<DeleteOutlined />}
                        onClick={() => removeShift(shift)}
                      />
                    </span>
                  </Tooltip>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="m-0 text-slate-600">
            Ca là mẫu giờ làm theo công trình; phân công mới chỉ sử dụng ca đang
            áp dụng.
          </p>
          <p className="m-0 mt-1 text-xs text-slate-500">
            Ngừng dùng giữ nguyên lịch sử. Xóa chỉ dành cho ca tạo nhầm và chưa
            từng được phân công.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BaseInput
            id="shift-search"
            aria-label="Tìm ca theo tên"
            className="min-w-52"
            allowClear
            placeholder="Tìm theo tên ca..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          <BaseSelect
            id="shift-status-filter"
            aria-label="Lọc ca theo trạng thái"
            className="min-w-44"
            allowClear
            placeholder="Tất cả trạng thái"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
            options={[
              { label: "Đang áp dụng", value: "active" },
              { label: "Ngừng áp dụng", value: "inactive" },
            ]}
          />
          {canCreate && (
            <BaseButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setActiveShift(null);
                setIsShiftModalOpen(true);
              }}
            >
              Tạo ca làm việc
            </BaseButton>
          )}
        </div>
      </div>

      <DataTable
        data={shifts}
        columns={columns}
        loading={isLoading}
        totalElements={totalShifts}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
        }}
        ariaLabel="Danh sách ca làm việc của công trình"
        emptyTitle="Chưa có ca làm việc"
        emptyDescription="Tạo ca đầu tiên hoặc thay đổi bộ lọc trạng thái."
      />

      <ShiftFormModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        siteId={siteId}
        activeShift={activeShift}
      />

      <ShiftOtConfigModal
        isOpen={isOtModalOpen}
        onClose={() => setIsOtModalOpen(false)}
        siteId={siteId}
        activeShift={activeShift}
      />
    </div>
  );
}
