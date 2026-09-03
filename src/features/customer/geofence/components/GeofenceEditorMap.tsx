"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import BaseButton from "@/components/ui/BaseButton";

// Load the complete Leaflet canvas as one client-only unit. This guarantees
// the click listener is mounted before the visible map can accept input.
const GeofenceEditorCanvas = dynamic(() => import("./GeofenceEditorCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100" />,
});

interface GeofenceEditorMapProps {
  latitude: number;
  longitude: number;
  initialCoordinates?: [number, number][]; // [lat, lng] format for Leaflet
  onChange: (coordinates: [number, number][]) => void;
}

export function GeofenceEditorMap({
  latitude,
  longitude,
  initialCoordinates = [],
  onChange,
}: GeofenceEditorMapProps) {
  const points = initialCoordinates;

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    const newPoints = [...points, [latlng.lat, latlng.lng] as [number, number]];
    onChange(newPoints);
  };

  const undo = () => {
    const newPoints = points.slice(0, -1);
    onChange(newPoints);
  };

  const clear = () => {
    onChange([]);
  };

  return (
    <div
      aria-label="Bản đồ vẽ vùng chấm công"
      className="relative h-[400px] w-full rounded-lg overflow-hidden border border-slate-300 z-0 group"
      role="region"
    >
      {/* Overlay Toolbar */}
      <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md border border-slate-200">
        <BaseButton
          onClick={(e: React.MouseEvent) => { e.preventDefault(); undo(); }}
          disabled={points.length === 0}
          className="!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 !h-7 !px-2.5 !py-0 rounded-md !text-[11px] font-semibold shadow-sm transition-all"
        >
          HOÀN TÁC ĐIỂM CUỐI
        </BaseButton>
        <BaseButton
          onClick={(e: React.MouseEvent) => { e.preventDefault(); clear(); }}
          disabled={points.length === 0}
          className="!bg-white !text-red-600 !border-red-200 hover:!bg-red-50 hover:!border-red-300 !h-7 !px-2.5 !py-0 rounded-md !text-[11px] font-semibold shadow-sm transition-all"
        >
          XÓA TOÀN BỘ
        </BaseButton>
      </div>

      <div className="absolute top-2 left-12 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-sm text-slate-700 pointer-events-none">
        Cần tối thiểu 3 điểm.
      </div>

      <GeofenceEditorCanvas
        latitude={latitude}
        longitude={longitude}
        points={points}
        onMapClick={handleMapClick}
      />
    </div>
  );
}
