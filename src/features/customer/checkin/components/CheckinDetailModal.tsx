"use client";

import React, { useEffect, useState } from "react";
import { Modal, Spin, Descriptions, Badge, Tag, Typography, message, Divider } from "antd";
import { checkinService } from "../services/checkin.service";
import { CheckinDetailResponse } from "../types/checkin.type";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth.store";

const { Text } = Typography;

interface CheckinDetailModalProps {
  checkinId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckinDetailModal({ checkinId, isOpen, onClose }: CheckinDetailModalProps) {
  const user = useAuthStore(state => state.user);
  const currentTenantId = user?.tenantId;
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CheckinDetailResponse | null>(null);

  useEffect(() => {
    if (isOpen && checkinId && currentTenantId) {
      fetchDetail(currentTenantId, checkinId);
    } else {
      setDetail(null);
    }
  }, [isOpen, checkinId, currentTenantId]);

  const fetchDetail = async (tenantId: string, id: string) => {
    try {
      setLoading(true);
      const data = await checkinService.getCheckinDetail(tenantId, id);
      setDetail(data);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi tải chi tiết chấm công");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "valid":
        return <Tag color="success">Hợp lệ</Tag>;
      case "pending_review":
        return <Tag color="warning">Cần xem xét</Tag>;
      case "rejected":
        return <Tag color="error">Bị từ chối</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  return (
    <Modal
      title="Chi tiết Check-in"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {loading ? (
        <div className="flex justify-center p-8">
          <Spin />
        </div>
      ) : detail ? (
        <div className="flex flex-col gap-4">
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Trạng thái" span={2}>
              {getStatusTag(detail.status)}
              {detail.message && <Text type="secondary" className="ml-2">({detail.message})</Text>}
            </Descriptions.Item>
            
            <Descriptions.Item label="Nhân viên">
              {detail.employee.firstName} {detail.employee.lastName} <br/>
              <Text type="secondary" className="text-xs">Mã NV: {detail.employee.employeeCode}</Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Vị trí làm việc (Site)">
              {detail.site.name} <br/>
              <Text type="secondary" className="text-xs">{detail.site.code}</Text>
            </Descriptions.Item>

            <Descriptions.Item label="Ca làm việc (Shift)" span={2}>
              {detail.shift ? (
                <>
                  {detail.shift.name} ({detail.shift.startTime} - {detail.shift.endTime})
                </>
              ) : "Không có"}
            </Descriptions.Item>

            <Descriptions.Item label="Rủi ro GPS (Risk Score)">
              <Text type={detail.gpsRiskScore > 0.5 ? "danger" : "success"}>
                {(detail.gpsRiskScore * 100).toFixed(0)}%
              </Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Device ID">
              <Text code>{detail.deviceId || "N/A"}</Text>
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" plain>Thông tin giờ vào (Check-in)</Divider>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Thời gian">
              {dayjs(detail.checkInAt).format("DD/MM/YYYY HH:mm:ss")}
            </Descriptions.Item>
            <Descriptions.Item label="Trong vùng (Geofence)">
              {detail.checkInInsideGeofence ? <Badge status="success" text="Có" /> : <Badge status="error" text="Không" />}
            </Descriptions.Item>
            <Descriptions.Item label="Tọa độ GPS" span={2}>
              Lat: {detail.checkInLat}, Lng: {detail.checkInLon} <br/>
              <Text type="secondary" className="text-xs">Độ chính xác: {detail.checkInAccuracy}m</Text>
              <div className="mt-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${detail.checkInLat},${detail.checkInLon}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-500 underline text-sm"
                >
                  Xem trên Google Maps
                </a>
              </div>
            </Descriptions.Item>
          </Descriptions>

          {detail.checkOutAt && (
            <>
              <Divider orientation="left" plain>Thông tin giờ ra (Check-out)</Divider>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Thời gian">
                  {dayjs(detail.checkOutAt).format("DD/MM/YYYY HH:mm:ss")}
                </Descriptions.Item>
                <Descriptions.Item label="Trong vùng (Geofence)">
                  {detail.checkOutInsideGeofence ? <Badge status="success" text="Có" /> : <Badge status="error" text="Không" />}
                </Descriptions.Item>
                <Descriptions.Item label="Tọa độ GPS" span={2}>
                  Lat: {detail.checkOutLat}, Lng: {detail.checkOutLon} <br/>
                  <Text type="secondary" className="text-xs">Độ chính xác: {detail.checkOutAccuracy}m</Text>
                  <div className="mt-2">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${detail.checkOutLat},${detail.checkOutLon}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-500 underline text-sm"
                    >
                      Xem trên Google Maps
                    </a>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </>
          )}

        </div>
      ) : (
        <div className="p-8 text-center text-slate-500">
          Không tìm thấy dữ liệu.
        </div>
      )}
    </Modal>
  );
}
