import React, { useState } from "react";
import { Card, Button } from "antd";
import { EditOutlined, EnvironmentOutlined, GlobalOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { SiteDetailResponse } from "../types/site.type";
import { GeofenceMap } from "./GeofenceMap";
import EditGeofenceModal from "../../geofence/components/EditGeofenceModal";

interface ActiveGeofenceCardProps {
  site: SiteDetailResponse;
  siteId: string;
}

export default function ActiveGeofenceCard({ site, siteId }: ActiveGeofenceCardProps) {
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);

  return (
    <>
      <Card 
        className="bg-white border-slate-200 shadow-sm" 
        title={<span className="text-slate-800 font-semibold">Bản đồ khu vực chấm công</span>}
        extra={
          <Button type="link" icon={<EditOutlined />} onClick={() => setIsGeofenceModalOpen(true)}>
            Cập nhật
          </Button>
        }
      >
        {site.latitude && site.longitude ? (
          <GeofenceMap 
            latitude={site.latitude} 
            longitude={site.longitude} 
            polygonCoordinates={site.geofence?.coordinates} 
          />
        ) : (
          <div className="h-[300px] w-full bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
            <span className="text-slate-400">Chưa cấu hình tọa độ</span>
          </div>
        )}
        
        <div className="mt-4 space-y-3">
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
        </div>
      </Card>

      {site.latitude && site.longitude && (
        <EditGeofenceModal
          isOpen={isGeofenceModalOpen}
          onClose={() => setIsGeofenceModalOpen(false)}
          siteId={siteId}
          latitude={site.latitude}
          longitude={site.longitude}
          activeGeofence={site.geofence}
        />
      )}
    </>
  );
}
