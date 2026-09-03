"use client";

import dynamic from "next/dynamic";
import dayjs from "dayjs";
import "leaflet/dist/leaflet.css";
import type { SupervisorSiteSummary } from "../types/dashboard.type";

const MapContainer = dynamic(() => import("react-leaflet").then((module) => module.MapContainer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((module) => module.CircleMarker), { ssr: false });
const LeafletTooltip = dynamic(() => import("react-leaflet").then((module) => module.Tooltip), { ssr: false });
const VectorBasemap = dynamic(() => import("@/components/maps/VectorBasemap"), { ssr: false });

export default function SupervisorCheckinMap({ site }: { site: SupervisorSiteSummary }) {
  const locatedEmployees = site.onSiteEmployees.filter(
    (employee) => employee.checkInLat != null && employee.checkInLon != null,
  );
  const center = site.siteLatitude != null && site.siteLongitude != null
    ? [site.siteLatitude, site.siteLongitude] as [number, number]
    : locatedEmployees[0]
      ? [locatedEmployees[0].checkInLat!, locatedEmployees[0].checkInLon!] as [number, number]
      : null;

  if (!center) {
    return <p className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">Chưa có tọa độ site hoặc tọa độ check-in để hiển thị bản đồ.</p>;
  }

  return (
    <div className="border-b border-slate-100 p-4">
      <div className="mb-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
        Các điểm nhân viên là <strong>vị trí ghi nhận lúc check-in</strong>, không phải vị trí hiện tại và không phải theo dõi liên tục.
      </div>
      <div
        aria-label={`Bản đồ vị trí check-in tại ${site.siteName}`}
        className="h-64 overflow-hidden rounded-lg border border-slate-200"
        role="region"
      >
        <MapContainer center={center} zoom={16} scrollWheelZoom={false} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <VectorBasemap />
          {site.siteLatitude != null && site.siteLongitude != null && (
            <CircleMarker center={[site.siteLatitude, site.siteLongitude]} radius={10} pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.75 }}>
              <LeafletTooltip permanent direction="top">Tâm site: {site.siteName}</LeafletTooltip>
            </CircleMarker>
          )}
          {locatedEmployees.map((employee) => (
            <CircleMarker key={employee.checkinId} center={[employee.checkInLat!, employee.checkInLon!]} radius={7} pathOptions={{ color: "#b45309", fillColor: "#f59e0b", fillOpacity: 0.85 }}>
              <LeafletTooltip direction="top">
                {employee.lastName} {employee.firstName}<br />Vị trí lúc check-in {dayjs(employee.checkInAt).format("HH:mm DD/MM/YYYY")}
              </LeafletTooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
