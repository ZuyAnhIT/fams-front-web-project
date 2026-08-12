import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Select, Spin } from "antd";
import { Search } from "lucide-react";
import { mapConfig } from "@/config/map";

// CSS-only marker keeps the map independent from third-party icon CDNs.
const customIcon = L.divIcon({
  className: "",
  html: '<span aria-hidden="true" style="display:block;width:22px;height:22px;border:3px solid white;border-radius:9999px;background:#2563eb;box-shadow:0 2px 8px rgba(15,23,42,.45)"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface LocationPickerMapProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number, address?: string) => void;
  className?: string;
}

interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationOption {
  label: string;
  value: string;
  lat: number;
  lng: number;
  address: string;
}

function isGeocodingResult(value: unknown): value is GeocodingResult {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.display_name === "string"
    && typeof item.lat === "string"
    && typeof item.lon === "string";
}

const DEFAULT_CENTER = { lat: 10.762622, lng: 106.660172 }; // Ho Chi Minh City

// Helper to reverse geocode using Nominatim API
const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
  try {
    const response = await fetch(
      `/api/maps/geocode?mode=reverse&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data?.display_name;
  } catch (error) {
    console.error("Reverse geocoding failed", error);
    return undefined;
  }
};

// Helper to forward geocode
const searchGeocode = async (query: string) => {
  try {
    const response = await fetch(
      `/api/maps/geocode?mode=search&q=${encodeURIComponent(query)}`
    );
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];
    return data.filter(isGeocodingResult).map((item) => ({
      label: item.display_name,
      value: `${item.lat},${item.lon}`,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name,
    }));
  } catch (error) {
    console.error("Search geocoding failed", error);
    return [];
  }
};

// Component to handle map clicks
function MapEvents({ onChange }: { onChange: (lat: number, lng: number, address?: string) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onChange(lat, lng, address);
    },
  });
  return null;
}

// Component to update view when props change
function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  className = "h-[400px] w-full z-0",
}: LocationPickerMapProps) {
  const center =
    latitude != null && longitude != null
      ? { lat: latitude, lng: longitude }
      : DEFAULT_CENTER;

  const [options, setOptions] = useState<LocationOption[]>([]);
  const [fetching, setFetching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  const handleSearch = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!value) {
      setOptions([]);
      return;
    }
    
    setOptions([]);
    setFetching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchGeocode(value);
      setOptions(results);
      setFetching(false);
    }, 500);
  };

  const handleSelect = (_value: string, option: LocationOption) => {
    onChange(option.lat, option.lng, option.address);
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-200">
      {/* Search Overlay */}
      <div className="absolute top-3 left-12 right-3 z-[1000]">
        <Select<string, LocationOption>
          showSearch
          placeholder="Tìm kiếm địa điểm (Tên đường, phường, quận...)"
          className="w-full shadow-lg rounded-lg"
          style={{ height: "40px" }}
          filterOption={false}
          onSearch={handleSearch}
          onSelect={handleSelect}
          notFoundContent={fetching ? <Spin size="small" /> : null}
          options={options}
          suffixIcon={<Search className="h-4 w-4 text-slate-400" />}
        />
      </div>

      <MapContainer
        center={center}
        zoom={13}
        className={className}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={mapConfig.attribution}
          url={mapConfig.tileUrl}
        />
        {latitude != null && longitude != null && (
          <Marker position={{ lat: latitude, lng: longitude }} icon={customIcon} />
        )}
        <MapUpdater center={center} />
        <MapEvents onChange={onChange} />
      </MapContainer>
    </div>
  );
}
