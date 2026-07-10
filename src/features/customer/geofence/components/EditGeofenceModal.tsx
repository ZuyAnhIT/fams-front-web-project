"use client";

import React, { useState, useEffect } from "react";
import { InputNumber, message, Alert } from "antd";
import BaseModal from "@/components/ui/BaseModal";
import BaseButton from "@/components/ui/BaseButton";
import { MapPin } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { GeofenceEditorMap } from "./GeofenceEditorMap";
import { useCreateGeofenceMutation, useUpdateGeofenceMutation } from "../hooks/use-geofence";
import { GeofenceResponse } from "../../site/types/site.type";

interface EditGeofenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  latitude: number;
  longitude: number;
  activeGeofence?: GeofenceResponse | null;
}

export default function EditGeofenceModal({
  isOpen,
  onClose,
  siteId,
  latitude,
  longitude,
  activeGeofence,
}: EditGeofenceModalProps) {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId;

  // The coordinates are stored as [lng, lat] in backend. 
  // Map uses [lat, lng]. We need to convert back and forth.
  const initialMapCoords: [number, number][] = activeGeofence?.coordinates
    ? activeGeofence.coordinates.map(c => [c[1], c[0]])
    : [];

  const [bufferMeters, setBufferMeters] = useState<number>(activeGeofence?.bufferMeters || 50);
  const [coordinates, setCoordinates] = useState<[number, number][]>(initialMapCoords);

  useEffect(() => {
    if (isOpen) {
      setBufferMeters(activeGeofence?.bufferMeters || 50);
      setCoordinates(activeGeofence?.coordinates ? activeGeofence.coordinates.map(c => [c[1], c[0]]) : []);
    }
  }, [isOpen, activeGeofence]);

  const createMutation = useCreateGeofenceMutation();
  const updateMutation = useUpdateGeofenceMutation();

  const handleSave = () => {
    if (!tenantId) return;

    if (coordinates.length < 3) {
      message.error("Vui lòng vẽ ít nhất 3 điểm trên bản đồ để tạo vùng.");
      return;
    }

    let submitCoords = [...coordinates];
    // Check if closed
    const firstP = submitCoords[0];
    const lastP = submitCoords[submitCoords.length - 1];
    if (firstP[0] !== lastP[0] || firstP[1] !== lastP[1]) {
      submitCoords.push([...firstP]);
    }

    // Convert [lat, lng] to [lng, lat]
    const backendCoords = submitCoords.map(c => [c[1], c[0]]);

    const data = {
      coordinates: backendCoords,
      bufferMeters: bufferMeters,
    };

    const isUpdate = !!activeGeofence;
    const mutation = isUpdate ? updateMutation : createMutation;

    mutation.mutate(
      { tenantId, siteId, data } as any,
      {
        onSuccess: () => {
          message.success("Lưu cấu hình vùng chấm công thành công!");
          onClose();
        },
        onError: (err: any) => {
          message.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu cấu hình.");
        },
      }
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <BaseModal
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Cấu hình Vùng Chấm Công (Geofence)</h2>

          </div>
        </div>
      }
      isOpen={isOpen}
      onClose={onClose}
      width={1000}
      centered
      destroyOnClose
      footer={
        <div className="flex justify-end gap-3 w-full">
          <BaseButton onClick={onClose} disabled={isLoading} className="!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-10 px-6 rounded-lg font-semibold transition-all">
            Hủy bỏ
          </BaseButton>
          <BaseButton type="primary" onClick={handleSave} loading={isLoading} className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-10 px-6 rounded-lg font-bold transition-all">
            Lưu cấu hình
          </BaseButton>
        </div>
      }
    >
      <div className="space-y-4 py-4">
        <Alert
          message="Click lên bản đồ để khoanh vùng khu vực chấm công. Hệ thống tự động khép kín đa giác. Nhấn Hoàn tác để xóa điểm vừa vẽ."
          type="info"
          showIcon
        />

        <div className="flex items-center gap-4 pt-2">
          <div className="font-medium text-slate-700">Bán kính sai số cho phép (Buffer Meters):</div>
          <InputNumber
            min={0}
            max={500}
            value={bufferMeters}
            onChange={(val) => setBufferMeters(val || 0)}
            className="w-32"
            addonAfter="mét"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <GeofenceEditorMap
              latitude={latitude}
              longitude={longitude}
              initialCoordinates={coordinates}
              onChange={setCoordinates}
            />
          </div>

          <div className="lg:col-span-1 border border-slate-200 rounded-lg p-3 bg-white h-[400px] overflow-y-auto shadow-inner">
            <div className="flex justify-between items-center mb-3 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Tọa độ chi tiết ({coordinates.length})</span>
              <BaseButton
                onClick={() => setCoordinates([...coordinates, [latitude, longitude]])}
                className="!bg-white !text-slate-600 !border-slate-300 hover:!bg-slate-50 border-dashed !h-7 !px-2.5 !py-0 !text-[11px] font-medium rounded transition-all"
              >
                + Thêm
              </BaseButton>
            </div>

            {coordinates.length === 0 ? (
              <div className="text-center text-slate-400 py-8 text-sm italic">
                Click lên bản đồ hoặc bấm "Thêm" để tạo điểm.
              </div>
            ) : (
              <div className="space-y-3">
                {coordinates.map((coord, index) => (
                  <div key={index} className="flex flex-col gap-1 p-2 bg-slate-50 border border-slate-200 rounded-md shadow-sm hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">Điểm {index + 1}</span>
                      <BaseButton
                        onClick={() => {
                          const newC = [...coordinates];
                          newC.splice(index, 1);
                          setCoordinates(newC);
                        }}
                        className="!bg-transparent !border-0 !text-red-500 hover:!text-red-700 hover:!bg-red-50 !h-6 !px-2 !py-0 !text-[10px] font-medium rounded transition-colors shadow-none"
                      >
                        Xóa
                      </BaseButton>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 font-medium block mb-1">Vĩ độ (Lat)</span>
                        <InputNumber
                          size="small"
                          className="w-full text-xs"
                          value={coord[0]}
                          onChange={(val) => {
                            if (val === null) return;
                            const newC = [...coordinates];
                            newC[index] = [val, newC[index][1]];
                            setCoordinates(newC);
                          }}
                          step={0.000001}
                          controls={false}
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 font-medium block mb-1">Kinh độ (Lng)</span>
                        <InputNumber
                          size="small"
                          className="w-full text-xs"
                          value={coord[1]}
                          onChange={(val) => {
                            if (val === null) return;
                            const newC = [...coordinates];
                            newC[index] = [newC[index][0], val];
                            setCoordinates(newC);
                          }}
                          step={0.000001}
                          controls={false}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
