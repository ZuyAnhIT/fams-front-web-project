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
  /** Computed polygon area in square metres (approximate — null if it could not be computed). */
  areaSqm?: number | null;
  /** Optional reason provided for this change. Null for the initial creation. */
  changeReason?: string | null;
  status: "active" | "superseded";
  createdBy: string;
  /** Display name of the user who created this version, resolved from createdBy. */
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}



export interface SiteSupervisorSummary {
  id: string;
  employeeCode?: string;
  fullName: string;
}

export interface SiteDetailResponse extends SiteResponse {
  geofence: GeofenceResponse | null;
  shifts: ShiftResponse[];
  activeAssignmentCount: number;
  /** Employees currently assigned to this site with role=supervisor — empty array if none. */
  supervisors: SiteSupervisorSummary[];
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
