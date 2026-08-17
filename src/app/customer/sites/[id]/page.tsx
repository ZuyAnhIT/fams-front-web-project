"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  App,
  Badge,
  Card,
  Descriptions,
  Empty,
  Result,
  Spin,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import {
  ArrowLeft,
  Edit3,
  MapPin,
  Trash2,
  Users,
} from "lucide-react";
import { isAxiosError } from "axios";
import RoleGuard from "@/components/guards/RoleGuard";
import BaseButton from "@/components/ui/BaseButton";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useAuthStore } from "@/stores/auth.store";
import {
  useDeleteSiteMutation,
  useSiteDetailQuery,
} from "@/features/customer/site/hooks/use-site";
import ActiveGeofenceCard from "@/features/customer/site/components/ActiveGeofenceCard";
import UpdateSiteModal from "@/features/customer/site/components/UpdateSiteModal";
import ShiftManagementTab from "@/features/customer/shift/components/ShiftManagementTab";
import AssignmentManagementTab from "@/features/customer/assignment/components/AssignmentManagementTab";
import GeofenceHistoryTab from "@/features/customer/geofence/components/GeofenceHistoryTab";
import SiteRandomCheckConfigTab from "@/features/customer/random-check/components/SiteRandomCheckConfigTab";

function SiteDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const siteId = String(params.id);
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId ?? undefined;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const {
    data: siteDetailResponse,
    isLoading,
    error,
  } = useSiteDetailQuery(tenantId, siteId);
  const deleteSite = useDeleteSiteMutation();
  const site = siteDetailResponse?.data;

  const canViewShifts =
    hasPermission("shifts:list") || hasPermission("shifts:read");
  const canViewAssignments =
    hasPermission("assignments:list") || hasPermission("assignments:read");
  const canViewGeofences =
    hasPermission("geofences:read") ||
    hasPermission("geofences:create") ||
    hasPermission("geofences:update");
  const canConfigureRandomChecks = hasPermission("randomchecks:configure");

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !site) {
    const status = (
      error as { response?: { status?: number } } | undefined
    )?.response?.status;
    return (
      <Result
        status={status === 403 ? "403" : "404"}
        title={
          status === 403
            ? "Bạn không có quyền xem công trình này"
            : "Không tìm thấy công trình"
        }
        subTitle={
          status === 403
            ? "Công trình nằm ngoài phạm vi site được giao hoặc tài khoản thiếu quyền sites:read."
            : "Công trình không tồn tại, đã bị xóa hoặc không thuộc công ty hiện tại."
        }
        extra={
          <BaseButton onClick={() => router.push("/customer/sites")}>
            Quay lại danh sách
          </BaseButton>
        }
      />
    );
  }

  const deleteBlocked = (site.activeAssignmentCount ?? 0) > 0;
  const deleteReason = deleteBlocked
    ? `Không thể xóa: còn ${site.activeAssignmentCount} nhân viên đang được phân công. Hãy kết thúc hoặc chuyển phân công trước.`
    : undefined;

  const handleDelete = () => {
    if (!tenantId || deleteBlocked) return;
    modal.confirm({
      title: `Xóa công trình “${site.name}”?`,
      content:
        "Công trình sẽ được xóa mềm. Lịch sử geofence và cấu hình ca vẫn được giữ lại phục vụ audit.",
      okText: "Xóa công trình",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteSite.mutateAsync({ tenantId, siteId });
          message.success("Đã xóa công trình");
          router.push("/customer/sites");
        } catch (deleteError: unknown) {
          const backendMessage = isAxiosError(deleteError)
            ? (deleteError.response?.data as { message?: string } | undefined)
                ?.message
            : undefined;
          message.error(
            backendMessage || "Không thể xóa công trình",
          );
          throw deleteError;
        }
      },
    });
  };

  const tabItems = [
    ...(canViewShifts
      ? [
          {
            key: "shifts",
            label: `Ca làm việc (${site.shifts?.length ?? 0})`,
            children: (
              <ShiftManagementTab tenantId={tenantId} siteId={siteId} />
            ),
          },
        ]
      : []),
    ...(canViewAssignments
      ? [
          {
            key: "assignments",
            label: `Nhân sự phân công (${site.activeAssignmentCount ?? 0})`,
            children: (
              <AssignmentManagementTab
                tenantId={tenantId}
                siteId={siteId}
                siteStatus={site.status}
                shifts={site.shifts ?? []}
              />
            ),
          },
        ]
      : []),
    ...(canViewGeofences
      ? [
          {
            key: "geofence-history",
            label: "Lịch sử geofence",
            children: (
              <GeofenceHistoryTab
                tenantId={tenantId}
                siteId={siteId}
                siteLatitude={site.latitude}
                siteLongitude={site.longitude}
              />
            ),
          },
        ]
      : []),
    ...(canConfigureRandomChecks
      ? [
          {
            key: "random-check-config",
            label: "Kiểm tra ngẫu nhiên",
            children: (
              <SiteRandomCheckConfigTab tenantId={tenantId} siteId={siteId} />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <BaseButton
            aria-label="Quay lại danh sách công trình"
            type="text"
            icon={<ArrowLeft className="h-5 w-5" />}
            onClick={() => router.push("/customer/sites")}
          />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="m-0 text-2xl font-bold text-slate-900">
                {site.name}
              </h1>
              <Badge
                status={site.status === "active" ? "success" : "default"}
                text={
                  site.status === "active"
                    ? "Đang hoạt động"
                    : "Ngừng hoạt động"
                }
              />
              {site.code && <Tag color="blue">{site.code}</Tag>}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Địa điểm chấm công, ca làm việc và nhân sự được phân công
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasPermission("sites:update") && (
            <BaseButton
              icon={<Edit3 className="h-4 w-4" />}
              onClick={() => setIsEditOpen(true)}
            >
              Sửa công trình
            </BaseButton>
          )}
          {hasPermission("sites:delete") && (
            <Tooltip title={deleteReason}>
              <span>
                <BaseButton
                  danger
                  icon={<Trash2 className="h-4 w-4" />}
                  disabled={deleteBlocked}
                  loading={deleteSite.isPending}
                  onClick={handleDelete}
                >
                  Xóa công trình
                </BaseButton>
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      {site.status === "inactive" && (
        <Alert
          type="warning"
          showIcon
          title="Công trình đã ngừng hoạt động"
          description="Giữ nguyên dữ liệu lịch sử để audit. Hãy kiểm tra và kết thúc các phân công còn hiệu lực trước khi xóa."
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {canViewGeofences ? (
            <ActiveGeofenceCard site={site} siteId={siteId} />
          ) : (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Tài khoản không có quyền xem geofence"
              />
            </Card>
          )}

          <Card
            title={
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                <MapPin className="h-4 w-4 text-blue-600" />
                Thông tin công trình
              </span>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Địa chỉ">
                {site.address || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Múi giờ">
                {site.timezone}
              </Descriptions.Item>
              <Descriptions.Item label="Tọa độ">
                {site.latitude != null && site.longitude != null
                  ? `${site.latitude}, ${site.longitude}`
                  : "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                {site.description || "Chưa có mô tả"}
              </Descriptions.Item>
              <Descriptions.Item label="Người phụ trách">
                {site.supervisors && site.supervisors.length > 0 ? (
                  <span className="flex flex-wrap gap-1">
                    {site.supervisors.map((sup) => (
                      <Tag key={sup.id} color="purple">
                        {sup.fullName}
                        {sup.employeeCode ? ` (${sup.employeeCode})` : ""}
                      </Tag>
                    ))}
                  </span>
                ) : (
                  "Chưa gán supervisor"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Nhân sự active">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {site.activeAssignmentCount ?? 0}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        <Card className="min-w-0 lg:col-span-2">
          {tabItems.length > 0 ? (
            <Tabs items={tabItems} />
          ) : (
            <Empty description="Tài khoản không có quyền xem dữ liệu vận hành của công trình" />
          )}
        </Card>
      </div>

      {isEditOpen && (
        <UpdateSiteModal
          site={site}
          isOpen
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
}

export default function SiteDetailsPage() {
  return (
    <RoleGuard
      allowedRoles={[SystemRole.PLATFORM_ADMIN]}
      allowedPermissions={["sites:read"]}
    >
      <SiteDetailsContent />
    </RoleGuard>
  );
}
