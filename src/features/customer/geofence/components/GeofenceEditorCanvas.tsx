"use client";

import {
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  Tooltip,
} from "react-leaflet";
import VectorBasemap from "@/components/maps/VectorBasemap";
import MapEvents from "./MapEvents";

interface GeofenceEditorCanvasProps {
  latitude: number;
  longitude: number;
  points: [number, number][];
  onMapClick: (latlng: { lat: number; lng: number }) => void;
}

export default function GeofenceEditorCanvas({
  latitude,
  longitude,
  points,
  onMapClick,
}: GeofenceEditorCanvasProps) {
  const isPolygon = points.length >= 3;

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={16}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", zIndex: 0, cursor: "crosshair" }}
    >
      <VectorBasemap />
      <MapEvents onClick={onMapClick} />

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

      {points.map((point, index) => (
        <CircleMarker
          key={`${point[0]}-${point[1]}-${index}`}
          center={point}
          radius={6}
          pathOptions={{
            color: index === 0 ? "#10b981" : "#ef4444",
            fillColor: "white",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -10]}
            opacity={1}
            permanent
            className="font-bold text-slate-700 bg-white/90 border border-slate-200 shadow-sm rounded px-1.5 py-0.5 text-[10px]"
          >
            Điểm {index + 1}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
