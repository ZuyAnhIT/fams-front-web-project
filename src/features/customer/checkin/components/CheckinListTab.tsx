"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, DatePicker, Tag, type TableColumnsType } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import BaseButton from "@/components/ui/BaseButton";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import { useAuthStore } from "@/stores/auth.store";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useSitesQuery } from "@/features/customer/site/hooks/use-site";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { formatVietnameseName } from "@/utils/name.util";
import { useCheckins } from "../hooks/use-checkin";
import {
  CHECKIN_POLICY_META,
  type CheckinPolicy,
} from "../constants/checkin-policy";
import type {
  CheckinListParams,
  CheckinResponse,
} from "../types/checkin.type";
import CheckinDetailModal from "./CheckinDetailModal";

const { RangePicker } = DatePicker;

function VerificationTag({
  value,
  liveness,
  policy,
  hasEvent = true,
}: {
  value: boolean | null | undefined;
  liveness?: boolean | null;
  policy: CheckinPolicy | null;
  hasEvent?: boolean;
}) {
  if (!hasEvent) return <Tag>Chưa check-out</Tag>;
  if (value == null) {
    if (policy === "gps_only") return <Tag>Không áp dụng</Tag>;
    if (policy) return <Tag color="processing">Đang xác thực</Tag>;
    return <Tag>Dữ liệu lịch sử</Tag>;
  }
  if (liveness === false) return <Tag color="error">Liveness thất bại</Tag>;
  if (!value) return <Tag color="error">Không khớp</Tag>;
  return (
    <Tag color={liveness ? "purple" : "success"}>
      {liveness ? "Đạt + liveness" : "Đạt Face ID"}
    </Tag>
  );
}

function pendingReason(record: CheckinResponse): string | null {
  if (record.status !== "pending_review") return null;
  if (
    record.livenessVerified === false ||
    record.checkoutLivenessVerified === false
  ) {
    return "Liveness thất bại";
  }
  if (
    record.faceVerified === false ||
    record.checkoutFaceVerified === false
  ) {
    return "Face ID không khớp";
  }
  if (
    record.checkInInsideGeofence === false ||
    record.checkOutInsideGeofence === false
  ) {
    return "Ngoài vùng chấm công";
  }
  return "Cần xem bằng chứng";
}

export default function CheckinListTab() {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? undefined;
  const supervisorMustChooseSite =
    user?.role === SystemRole.SITE_SUPERVISOR;

  const [params, setParams] = useState<CheckinListParams>({
    page: 0,
    size: 20,
    sortBy: "checkInAt",
    sortDir: "desc",
  });
  const [selectedCheckinId, setSelectedCheckinId] = useState<string | null>(
    searchParams.get("checkinId"),
  );

  const { data: sitePage } = useSitesQuery({
    tenantId,
    sortBy: "name",
    sortDir: "asc",
    page: 0,
    size: 100,
  });
  const sites = useMemo(
    () => sitePage?.data?.content ?? [],
    [sitePage?.data?.content],
  );

  const effectiveSiteId =
    params.siteId ||
    (supervisorMustChooseSite && sites.length === 1 ? sites[0].id : undefined);
  const requestParams = useMemo(
    () => ({ ...params, siteId: effectiveSiteId }),
    [effectiveSiteId, params],
  );

  const { data: employeePage } = useEmployees(
    {
      page: 0,
      size: 100,
      sortBy: "firstName",
      sortDir: "asc",
    },
    { enabled: Boolean(tenantId) },
  );
  const employees = useMemo(
    () => employeePage?.content ?? [],
    [employeePage?.content],
  );
  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );
  const siteMap = useMemo(
    () => new Map(sites.map((site) => [site.id, site])),
    [sites],
  );

  const canLoad =
    Boolean(tenantId) && (!supervisorMustChooseSite || Boolean(effectiveSiteId));
  const { data: pageData, isLoading, isError, error } = useCheckins(
    tenantId,
    requestParams,
    canLoad,
  );

  const columns: TableColumnsType<CheckinResponse> = [
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (status: CheckinResponse["status"], record) => {
        const reason = pendingReason(record);
        return (
          <div className="space-y-1">
            <Tag
              color={
                status === "valid"
                  ? "success"
                  : status === "pending_review"
                    ? "warning"
                    : "error"
              }
            >
              {status === "valid"
                ? "Hợp lệ"
                : status === "pending_review"
                  ? "Cần xem xét"
                  : "Bị từ chối"}
            </Tag>
            <div>
              <Tag color={record.source === "offline" ? "blue" : "default"}>
                {record.source === "offline" ? "Offline" : "Online"}
              </Tag>
              {record.effectiveCheckinPolicy && (
                <Tag
                  color={
                    CHECKIN_POLICY_META[record.effectiveCheckinPolicy].color
                  }
                >
                  {CHECKIN_POLICY_META[record.effectiveCheckinPolicy].shortLabel}
                </Tag>
              )}
            </div>
            {reason && (
              <div className="text-xs font-medium text-amber-700">{reason}</div>
            )}
          </div>
        );
      },
    },
    {
      title: "Nhân viên",
      key: "employee",
      width: 190,
      render: (_, record) => {
        const employee = employeeMap.get(record.employeeId);
        return (
          <div>
            <div className="font-medium text-slate-800">
              {record.employeeName ||
                (employee
                  ? formatVietnameseName(employee.firstName, employee.lastName)
                  : record.employeeId)}
            </div>
            <div className="text-xs text-slate-500">
              {record.employeeCode || employee?.employeeCode || "Chưa có mã"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Công trình",
      key: "site",
      width: 170,
      render: (_, record) =>
        record.siteName || siteMap.get(record.siteId)?.name || record.siteId,
    },
    {
      title: "Giờ vào / ra",
      key: "timestamps",
      width: 200,
      sorter: true,
      render: (_, record) => (
        <div className="space-y-1 text-sm text-slate-700">
          <div>
            Vào:{" "}
            {record.checkInAt
              ? dayjs(record.checkInAt).format("DD/MM/YYYY HH:mm:ss")
              : "—"}
          </div>
          <div>
            Ra:{" "}
            {record.checkOutAt
              ? dayjs(record.checkOutAt).format("DD/MM/YYYY HH:mm:ss")
              : "Chưa check-out"}
          </div>
          {record.workMinutes != null && (
            <div className="text-xs font-medium text-blue-700">
              {record.workMinutes} phút làm việc
            </div>
          )}
        </div>
      ),
    },
    {
      title: "GPS",
      key: "geofence",
      width: 140,
      render: (_, record) => (
        <div className="space-y-1">
          <div>
            Vào:{" "}
            <Tag color={record.checkInInsideGeofence ? "success" : "error"}>
              {record.checkInInsideGeofence ? "Trong vùng" : "Ngoài vùng"}
            </Tag>
          </div>
          <div>
            Ra:{" "}
            {record.checkOutAt ? (
              record.checkOutInsideGeofence == null ? (
                <Tag>Chi tiết</Tag>
              ) : (
                <Tag
                  color={
                    record.checkOutInsideGeofence ? "success" : "error"
                  }
                >
                  {record.checkOutInsideGeofence ? "Trong vùng" : "Ngoài vùng"}
                </Tag>
              )
            ) : (
              <Tag>Chưa có</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Face ID vào / ra",
      key: "faceVerification",
      width: 190,
      render: (_, record) => (
        <div className="space-y-1">
          <div>
            <span className="mr-1 text-xs text-slate-500">Vào:</span>
            <VerificationTag
              value={record.faceVerified}
              liveness={record.livenessVerified}
              policy={record.effectiveCheckinPolicy}
            />
          </div>
          <div>
            <span className="mr-1 text-xs text-slate-500">Ra:</span>
            <VerificationTag
              value={record.checkoutFaceVerified}
              liveness={record.checkoutLivenessVerified}
              policy={record.effectiveCheckinPolicy}
              hasEvent={Boolean(record.checkOutAt)}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 110,
      render: (_, record) => (
        <BaseButton
          type="link"
          icon={<EyeOutlined />}
          onClick={() => setSelectedCheckinId(record.id)}
        >
          Chi tiết
        </BaseButton>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        title="Check-in và check-out dùng cùng mức xác thực"
        description="Chính sách hiệu lực được Backend resolve từ công trình và ca làm. Bản ghi cần xem xét có thể do GPS, Face ID, liveness hoặc đồng bộ offline."
      />

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-4 sm:p-4">
        <BaseSelect
          aria-label="Lọc lượt chấm công theo công trình"
          allowClear={!supervisorMustChooseSite}
          placeholder={
            supervisorMustChooseSite
              ? "Chọn công trình bắt buộc"
              : "Tất cả công trình"
          }
          value={effectiveSiteId}
          onChange={(siteId) =>
            setParams((current) => ({ ...current, siteId, page: 0 }))
          }
          options={sites.map((site) => ({
            value: site.id,
            label: site.name,
          }))}
        />
        <BaseSelect
          aria-label="Lọc lượt chấm công theo nhân viên"
          showSearch
          optionFilterProp="label"
          allowClear
          placeholder="Tất cả nhân viên"
          value={params.employeeId}
          onChange={(employeeId) =>
            setParams((current) => ({ ...current, employeeId, page: 0 }))
          }
          options={employees.map((employee) => ({
            value: employee.id,
            label: `${formatVietnameseName(employee.firstName, employee.lastName)}${employee.employeeCode ? ` (${employee.employeeCode})` : ""}`,
          }))}
        />
        <BaseSelect
          aria-label="Lọc lượt chấm công theo trạng thái"
          allowClear
          placeholder="Tất cả trạng thái"
          value={params.status}
          onChange={(status) =>
            setParams((current) => ({ ...current, status, page: 0 }))
          }
          options={[
            { label: "Hợp lệ", value: "valid" },
            { label: "Cần xem xét", value: "pending_review" },
            { label: "Bị từ chối", value: "rejected" },
          ]}
        />
        <RangePicker
          aria-label="Lọc lượt chấm công theo khoảng thời gian"
          showTime
          onChange={(dates) =>
            setParams((current) => ({
              ...current,
              from: dates?.[0]?.toISOString(),
              to: dates?.[1]?.toISOString(),
              page: 0,
            }))
          }
        />
      </div>

      {supervisorMustChooseSite && !effectiveSiteId && (
        <Alert
          type="warning"
          showIcon
          title="Hãy chọn một công trình"
          description="Supervisor được giao nhiều công trình phải chọn từng công trình trước khi tải danh sách chấm công."
        />
      )}

      {isError && (
        <Alert
          type="error"
          showIcon
          title="Không thể tải danh sách chấm công"
          description={
            (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Vui lòng thử lại."
          }
        />
      )}

      <DataTable
        ariaLabel="Lịch sử chấm công"
        emptyTitle="Không có lượt chấm công"
        emptyDescription="Thử chọn khoảng thời gian, công trình hoặc trạng thái khác."
        columns={columns}
        data={pageData?.content || []}
        rowKey="id"
        loading={isLoading}
        currentPage={params.page || 0}
        pageSize={params.size || 20}
        totalElements={pageData?.totalElements || 0}
        onPageChange={(page, size) =>
          setParams((current) => ({ ...current, page, size }))
        }
        onChange={(_, __, sorter, extra) => {
          if (extra.action !== "sort") return;
          const item = Array.isArray(sorter) ? sorter[0] : sorter;
          setParams((current) => ({
            ...current,
            sortBy: item?.order ? "checkInAt" : current.sortBy,
            sortDir:
              item?.order === "ascend"
                ? "asc"
                : item?.order === "descend"
                  ? "desc"
                  : current.sortDir,
            page: 0,
          }));
        }}
        scroll={{ x: 1350 }}
      />

      <CheckinDetailModal
        isOpen={Boolean(selectedCheckinId)}
        onClose={() => setSelectedCheckinId(null)}
        checkinId={selectedCheckinId}
      />
    </div>
  );
}
