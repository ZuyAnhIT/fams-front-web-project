"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import BaseButton from "@/components/ui/BaseButton";
import { mapConfig } from "@/config/map";

// Dynamic import for react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Polygon = dynamic(() => import("react-leaflet").then((mod) => mod.Polygon), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), { ssr: false });

const MapEvents = dynamic(() => import("./MapEvents"), { ssr: false });

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

  const isPolygon = points.length >= 3;

  return (
    <div className="relative h-[400px] w-full rounded-lg overflow-hidden border border-slate-300 z-0 group">
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

      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0, cursor: "crosshair" }}
      >
        <TileLayer
          attribution={mapConfig.attribution}
          url={mapConfig.tileUrl}
        />
        <MapEvents onClick={handleMapClick} />

        <CircleMarker
          center={[latitude, longitude]}
          radius={8}
          pathOptions={{ color: "white", fillColor: "#2563eb", fillOpacity: 1, weight: 3 }}
        />

        {isPolygon ? (
          <Polygon
            positions={points}
            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.3, weight: 2 }}
          />
        ) : points.length > 0 ? (
          <Polyline
            positions={points}
            pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "5, 5" }}
          />
        ) : null}

        {/* Draw vertices */}
        {points.map((p, i) => (
          <CircleMarker
            key={i}
            center={p}
            radius={6}
            pathOptions={{ color: i === 0 ? "#10b981" : "#ef4444", fillColor: "white", fillOpacity: 1, weight: 2 }}
          >
            <Tooltip
              direction="top"
              offset={[0, -10]}
              opacity={1}
              permanent
              className="font-bold text-slate-700 bg-white/90 border border-slate-200 shadow-sm rounded px-1.5 py-0.5 text-[10px]"
            >
              Điểm {i + 1}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
