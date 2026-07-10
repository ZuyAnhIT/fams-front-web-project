"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useSiteDetailQuery } from "@/features/customer/site/hooks/use-site";
import { useShiftsQuery } from "@/features/customer/shift/hooks/use-shift";
import { useAssignments } from "@/features/customer/assignment/hooks/use-assignments";
import { Tabs, Badge, Card, Button, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ActiveGeofenceCard from "@/features/customer/site/components/ActiveGeofenceCard";
import ShiftManagementTab from "@/features/customer/shift/components/ShiftManagementTab";
import AssignmentManagementTab from "@/features/customer/assignment/components/AssignmentManagementTab";
import GeofenceHistoryTab from "@/features/customer/geofence/components/GeofenceHistoryTab";

export default function SiteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId || undefined;

  // Fetch site data
  const { data: siteDetailRes, isLoading: isSiteLoading } = useSiteDetailQuery(tenantId, siteId);
  const site = siteDetailRes?.data;

  // We need total counts for tabs (shifts and assignments)
  // But we can let the child tabs fetch them independently to separate concerns.
  // We just fetch minimal info if needed for labels.
  const { data: shiftsRes } = useShiftsQuery(tenantId, siteId, { page: 0, size: 100 });
  const shifts = shiftsRes?.content || [];
  const totalShifts = shiftsRes?.totalElements || 0;

  const { data: assignmentsRes } = useAssignments(tenantId || "", siteId, { page: 0, size: 1 });
  const totalAssignments = assignmentsRes?.data?.totalElements || 0;

  if (isSiteLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!site) {
    return (
      <div>
        <h1 className="text-xl text-slate-800">Không tìm thấy thông tin công trình.</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined className="text-slate-600" />} 
          onClick={() => router.back()}
          className="hover:bg-slate-100"
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 m-0">{site.name}</h1>
            <Badge 
              status={site.status === "active" ? "success" : "default"} 
              text={site.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"} 
              className="text-slate-600 bg-slate-100 px-2 py-1 rounded-full border border-slate-200" 
            />
          </div>
          {site.code && <p className="text-slate-500 mt-1">Mã công trình: {site.code}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Map & Info */}
        <div className="lg:col-span-1 space-y-6">
          <ActiveGeofenceCard site={site} siteId={siteId} />
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm h-full" bodyStyle={{ padding: '0 24px 24px' }}>
            <Tabs 
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: <span className="text-slate-700 font-medium">Ca làm việc ({totalShifts})</span>,
                  children: <ShiftManagementTab tenantId={tenantId} siteId={siteId} />,
                },
                {
                  key: "2",
                  label: <span className="text-slate-700 font-medium">Nhân sự phân công ({totalAssignments})</span>,
                  children: <AssignmentManagementTab tenantId={tenantId} siteId={siteId} shifts={shifts} />,
                },
                {
                  key: "3",
                  label: <span className="text-slate-700 font-medium">Lịch sử cấu hình</span>,
                  children: (
                    <GeofenceHistoryTab 
                      tenantId={tenantId} 
                      siteId={siteId} 
                      siteLatitude={site.latitude} 
                      siteLongitude={site.longitude} 
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
