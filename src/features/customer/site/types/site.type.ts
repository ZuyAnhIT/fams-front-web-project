import { ShiftResponse } from "../../shift/types/shift.type";
import type { CheckinPolicy } from "../../checkin/constants/checkin-policy";

export interface SiteResponse {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  checkinPolicy: CheckinPolicy;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceResponse {
  id: string;
  siteId: string;
  tenantId: string;
  coordinates: number[][]; // [longitude, latitude] pairs
  bufferMeters: number;
  status: "active" | "superseded";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}



export interface SiteDetailResponse extends SiteResponse {
  geofence: GeofenceResponse | null;
  shifts: ShiftResponse[];
  activeAssignmentCount: number;
}

export interface CreateSiteRequest {
  name: string;
  code?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  checkinPolicy?: CheckinPolicy;
}

export interface UpdateSiteRequest {
  name?: string;
  code?: string;
  clearCode?: boolean;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  checkinPolicy?: CheckinPolicy;
  status?: "active" | "inactive";
}

export interface SiteListParams {
  tenantId?: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}
