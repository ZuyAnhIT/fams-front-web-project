import React, { useState } from "react";
import { Badge } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import { BaseModal } from "@/components/ui";
import { useGeofenceHistoryQuery } from "../hooks/use-geofence";
import { GeofenceResponse } from "../../site/types/site.type";
import { GeofenceMap } from "../../site/components/GeofenceMap";

interface GeofenceHistoryTabProps {
  tenantId?: string;
  siteId: string;
  siteLatitude?: number | null;
  siteLongitude?: number | null;
}

export default function GeofenceHistoryTab({ tenantId, siteId, siteLatitude, siteLongitude }: GeofenceHistoryTabProps) {
  const [historyPage, setHistoryPage] = useState(0);
  const [historySort, setHistorySort] = useState({ sortBy: "createdAt", sortDir: "desc" as "asc" | "desc" | undefined });

  const [selectedHistoryGeofence, setSelectedHistoryGeofence] = useState<GeofenceResponse | null>(null);

  const { data: historyRes, isLoading: isHistoryLoading } = useGeofenceHistoryQuery(
    tenantId,
    siteId,
    { page: historyPage, size: 10, sortBy: historySort.sortBy, sortDir: historySort.sortDir }
  );
  
  const history = historyRes?.content || [];
  const totalHistory = historyRes?.totalElements || 0;

  const historyColumns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (val: string) => new Date(val).toLocaleString("vi-VN"),
    },
    {
      title: "Bán kính (Buffer)",
      dataIndex: "bufferMeters",
      key: "bufferMeters",
      render: (val: number) => `${val}m`,
    },
    {
      title: "Người thay đổi",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (value: string) => (
        <span className="font-mono text-xs text-slate-600">{value || "—"}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (val: string) => (
        <Badge status={val === "active" ? "success" : "default"} text={val === "active" ? "Đang áp dụng" : "Bị thay thế (Cũ)"} className="text-slate-600" />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: GeofenceResponse) => (
        <BaseButton 
          type="text" 
          icon={<EyeOutlined className="text-blue-500" />} 
          onClick={() => setSelectedHistoryGeofence(record)}
        >
          Xem bản đồ
        </BaseButton>
      ),
    },
  ];

  return (
    <>
      <DataTable 
        ariaLabel="Lịch sử thay đổi geofence"
        emptyTitle="Chưa có lịch sử geofence"
        emptyDescription="Phiên bản đầu tiên sẽ xuất hiện sau khi geofence được cấu hình."
        data={history} 
        columns={historyColumns as any} 
        loading={isHistoryLoading}
        totalElements={totalHistory}
        currentPage={historyPage}
        pageSize={10}
        onPageChange={(p) => setHistoryPage(p)}
        onChange={(pagination, filters, sorter: any) => {
          if (sorter && (sorter.columnKey || sorter.field)) {
            setHistorySort({
              sortBy: sorter.columnKey || sorter.field,
              sortDir: sorter.order === 'ascend' ? 'asc' : 'desc'
            });
          } else {
            setHistorySort({ sortBy: "createdAt", sortDir: "desc" });
          }
        }}
      />

      <BaseModal
        title={
          <span className="text-slate-800">
            Bản đồ chấm công - Phiên bản ngày {selectedHistoryGeofence ? new Date(selectedHistoryGeofence.createdAt).toLocaleString("vi-VN") : ""}
          </span>
        }
        isOpen={!!selectedHistoryGeofence}
        onClose={() => setSelectedHistoryGeofence(null)}
        hideFooter
        width={1000}
        destroyOnClose
        centered
      >
        <div className="py-4 space-y-4">
          <div className="flex gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
            <div className="text-slate-600">
              <span className="font-semibold text-slate-700">Bán kính cho phép:</span> {selectedHistoryGeofence?.bufferMeters} mét
            </div>
            <div className="text-slate-600">
              <span className="font-semibold text-slate-700">Trạng thái:</span>{" "}
              {selectedHistoryGeofence?.status === "active" ? (
                <span className="text-green-600 font-medium">Đang áp dụng</span>
              ) : (
                <span className="text-slate-500 font-medium">Bị thay thế (Lịch sử)</span>
              )}
            </div>
          </div>
          {siteLatitude && siteLongitude && selectedHistoryGeofence && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 h-[450px] border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                <GeofenceMap 
                  latitude={siteLatitude} 
                  longitude={siteLongitude} 
                  polygonCoordinates={selectedHistoryGeofence.coordinates} 
                  heightClassName="h-full"
                />
              </div>
              <div className="lg:col-span-1 border border-slate-200 rounded-lg p-3 bg-white h-[450px] overflow-y-auto shadow-inner">
                <div className="font-semibold text-slate-700 mb-3 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
                  Tọa độ chi tiết ({selectedHistoryGeofence.coordinates.length > 1 ? selectedHistoryGeofence.coordinates.length - 1 : 0} điểm)
                </div>
                <div className="space-y-3">
                  {selectedHistoryGeofence.coordinates.map((coord, index) => {
                    // Skip the last point if it's identical to the first (closed loop)
                    if (index > 0 && index === selectedHistoryGeofence.coordinates.length - 1 && coord[0] === selectedHistoryGeofence.coordinates[0][0] && coord[1] === selectedHistoryGeofence.coordinates[0][1]) {
                      return null;
                    }
                    return (
                      <div key={index} className="flex flex-col gap-1 p-2 bg-slate-50 border border-slate-200 rounded-md shadow-sm">
                        <span className="text-xs font-bold text-slate-600">Điểm {index + 1}</span>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-white border border-slate-200 rounded p-1 text-xs text-slate-600 text-center">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Vĩ độ (Lat)</span>
                            {coord[1]}
                          </div>
                          <div className="flex-1 bg-white border border-slate-200 rounded p-1 text-xs text-slate-600 text-center">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Kinh độ (Lng)</span>
                            {coord[0]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </BaseModal>
    </>
  );
}
