import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Select, Spin } from "antd";
import { Search } from "lucide-react";

// Fix Leaflet's default icon missing issue in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerMapProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number, address?: string) => void;
  className?: string;
}

const DEFAULT_CENTER = { lat: 10.762622, lng: 106.660172 }; // Ho Chi Minh City

// Helper to reverse geocode using Nominatim API
const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
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
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=vn&accept-language=vi`
    );
    const data = await response.json();
    return data.map((item: any) => ({
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
  const center = latitude && longitude ? { lat: latitude, lng: longitude } : DEFAULT_CENTER;

  const [options, setOptions] = useState<any[]>([]);
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

  const handleSelect = (value: string, option: any) => {
    onChange(option.lat, option.lng, option.address);
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-200">
      {/* Search Overlay */}
      <div className="absolute top-3 left-12 right-3 z-[1000]">
        <Select
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {(latitude && longitude) && (
          <Marker position={{ lat: latitude, lng: longitude }} icon={customIcon} />
        )}
        <MapUpdater center={center} />
        <MapEvents onChange={onChange} />
      </MapContainer>
    </div>
  );
}
