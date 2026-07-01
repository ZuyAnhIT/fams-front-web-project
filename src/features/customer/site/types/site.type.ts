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
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface SiteDetailResponse extends SiteResponse {
  // Can include geofence, shifts, activeAssignmentCount later
}

export interface CreateSiteRequest {
  name: string;
  code?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
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
