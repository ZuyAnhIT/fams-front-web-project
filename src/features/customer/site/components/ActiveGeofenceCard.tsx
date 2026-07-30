import React, { useState } from "react";
import { Alert, Card, Tag, Tooltip } from "antd";
import BaseButton from "@/components/ui/BaseButton";
import {
  EditOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { SiteDetailResponse } from "../types/site.type";
import { GeofenceMap } from "./GeofenceMap";
import EditGeofenceModal from "../../geofence/components/EditGeofenceModal";
import { useAuthStore } from "@/stores/auth.store";
import {
  CHECKIN_POLICY_META,
  normalizeCheckinPolicy,
} from "../../checkin/constants/checkin-policy";

interface ActiveGeofenceCardProps {
  site: SiteDetailResponse;
  siteId: string;
}

export default function ActiveGeofenceCard({ site, siteId }: ActiveGeofenceCardProps) {
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canConfigure = site.geofence
    ? hasPermission("geofences:update")
    : hasPermission("geofences:create");
  const hasCenter = site.latitude != null && site.longitude != null;
  const policy = normalizeCheckinPolicy(site.checkinPolicy);

  return (
    <>
      <Card 
        className="bg-white border-slate-200 shadow-sm" 
        title={<span className="text-slate-800 font-semibold">Vùng chấm công</span>}
        extra={canConfigure ? (
          <Tooltip title={!hasCenter ? "Hãy cập nhật tọa độ trung tâm của công trình trước" : undefined}>
            <span>
              <BaseButton
                aria-label={site.geofence ? "Cập nhật geofence" : "Tạo geofence"}
                type="link"
                icon={<EditOutlined />}
                disabled={!hasCenter}
                onClick={() => setIsGeofenceModalOpen(true)}
              >
                {site.geofence ? "Cập nhật" : "Tạo geofence"}
              </BaseButton>
            </span>
          </Tooltip>
        ) : null}
      >
        {hasCenter ? (
          <GeofenceMap 
            latitude={site.latitude!}
            longitude={site.longitude!}
            polygonCoordinates={site.geofence?.coordinates} 
          />
        ) : (
          <div className="h-[300px] w-full bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
            <span className="text-slate-400">Chưa cấu hình tọa độ</span>
          </div>
        )}

        {!site.geofence && (
          <Alert
            className="mt-4"
            type="warning"
            showIcon
            message="Công trình chưa có geofence"
            description="Chưa có polygon active để backend đối chiếu vị trí check-in. Hãy cấu hình vùng chấm công trước khi vận hành chính thức."
          />
        )}
        
        <div className="mt-4 space-y-3">
          {site.geofence && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
              <span className="font-medium text-blue-800">
                Sai số GPS cho phép: {site.geofence.bufferMeters} mét
              </span>
              <Tag color="success" className="m-0">Đang áp dụng</Tag>
            </div>
          )}
          <div className="flex items-start gap-3 text-slate-600">
            <EnvironmentOutlined className="mt-1 text-blue-500" />
            <div>
              <div className="font-medium text-slate-700">Địa chỉ</div>
              <div className="text-sm">{site.address || "Chưa cập nhật"}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <GlobalOutlined className="text-green-500" />
            <div>
              <div className="font-medium text-slate-700">Múi giờ</div>
              <div className="text-sm">{site.timezone}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <ClockCircleOutlined className="text-purple-500" />
            <div>
              <div className="font-medium text-slate-700">Tọa độ trung tâm</div>
              <div className="text-sm">{site.latitude}, {site.longitude}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <SafetyCertificateOutlined className="text-cyan-600" />
            <div>
              <div className="font-medium text-slate-700">
                Chính sách chấm công mặc định
              </div>
              <Tag
                color={CHECKIN_POLICY_META[policy].color}
                className="mt-1"
              >
                {CHECKIN_POLICY_META[policy].label}
              </Tag>
              <div className="mt-1 text-xs text-slate-500">
                Ca làm có thể ghi đè chính sách này.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {isGeofenceModalOpen && hasCenter && (
        <EditGeofenceModal
          isOpen={isGeofenceModalOpen}
          onClose={() => setIsGeofenceModalOpen(false)}
          siteId={siteId}
          latitude={site.latitude!}
          longitude={site.longitude!}
          activeGeofence={site.geofence}
        />
      )}
    </>
  );
}
