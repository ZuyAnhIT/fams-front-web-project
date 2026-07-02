"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamic import for react-leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);

interface GeofenceMapProps {
  latitude: number;
  longitude: number;
  polygonCoordinates?: number[][];
  heightClassName?: string;
}

export function GeofenceMap({
  latitude,
  longitude,
  polygonCoordinates,
  heightClassName = "h-[300px]",
}: GeofenceMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fix for Leaflet marker icon issue in Next.js
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  if (!mounted) {
    return (
      <div className={`${heightClassName} w-full bg-slate-800 rounded-lg animate-pulse flex items-center justify-center`}>
        <span className="text-slate-500">Đang tải bản đồ...</span>
      </div>
    );
  }

  // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
  const positions: [number, number][] = polygonCoordinates
    ? polygonCoordinates.map((coord) => [coord[1], coord[0]])
    : [];

  return (
    <div className={`${heightClassName} w-full rounded-lg overflow-hidden border border-slate-700 relative z-0`}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} />
        {positions.length > 0 && (
          <>
            <Polygon
              positions={positions}
              pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.2 }}
            />
            {positions.map((p, i) => {
              // Skip drawing the last point if it's identical to the first (closed loop)
              if (i > 0 && i === positions.length - 1 && p[0] === positions[0][0] && p[1] === positions[0][1]) {
                return null;
              }
              return (
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
              );
            })}
          </>
        )}
      </MapContainer>
    </div>
  );
}
