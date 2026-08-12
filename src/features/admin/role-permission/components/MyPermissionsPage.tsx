"use client";

import { Alert, Empty, Spin, Tag } from "antd";
import { Building2, Globe2, MapPin, ShieldCheck } from "lucide-react";
import ContentCard from "@/components/shared/layout/ContentCard";
import { useMyRolesQuery } from "../hooks/use-role-permission";

export function MyPermissionsPage() {
  const { data, isLoading, isError } = useMyRolesQuery();
  const assignments = data?.data || [];

  if (isLoading) {
    return <div className="flex min-h-64 items-center justify-center"><Spin size="large" /></div>;
  }

  if (isError) {
    return <Alert type="error" showIcon title="Không thể tải quyền hiện tại" description="Vui lòng tải lại trang hoặc đăng nhập lại." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          Quyền của tôi
        </h2>
        <p className="mt-1 text-sm text-slate-500">Thông tin chỉ đọc về role, công ty, phạm vi công trình và quyền bạn đang có.</p>
      </div>

      <Alert
        type="info"
        showIcon
        title="Phạm vi không giới hạn được ưu tiên"
        description="Nếu một trong các role áp dụng toàn công ty, quyền tương ứng không còn bị giới hạn bởi site ở các role khác."
      />

      {assignments.length === 0 ? (
        <Empty description="Tài khoản chưa được gán role nào" />
      ) : (
        assignments.map((assignment) => (
          <ContentCard key={assignment.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{assignment.roleName || "Role chưa đặt tên"}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  {assignment.tenantId ? <Building2 className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}
                  {assignment.tenantName || (assignment.tenantId ? "Công ty hiện tại" : "Toàn nền tảng")}
                </div>
              </div>
              <Tag color={assignment.siteIds?.length ? "gold" : "green"} icon={<MapPin className="inline h-3 w-3" />}>
                {assignment.sites?.length
                  ? assignment.sites.map((site) => site.name).join(", ")
                  : assignment.siteIds?.length
                    ? `${assignment.siteIds.length} công trình`
                    : "Không giới hạn site"}
              </Tag>
            </div>

            {assignment.siteIds && assignment.siteIds.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Công trình trong phạm vi</p>
                <div className="flex flex-wrap gap-2">
                  {assignment.sites?.length
                    ? assignment.sites.map((site) => <Tag key={site.id}>{site.name}</Tag>)
                    : assignment.siteIds.map((siteId) => <Tag key={siteId}>{siteId}</Tag>)}
                </div>
              </div>
            )}

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Quyền được cấp</p>
              <div className="flex flex-wrap gap-2">
                {assignment.permissions?.length
                  ? assignment.permissions.map((permission) => <Tag color="blue" key={permission}>{permission}</Tag>)
                  : <span className="text-sm text-slate-400">Role không có permission.</span>}
              </div>
            </div>
          </ContentCard>
        ))
      )}
    </div>
  );
}
