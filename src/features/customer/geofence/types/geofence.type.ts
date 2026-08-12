export interface CreateGeofenceRequest {
  coordinates: number[][]; // [longitude, latitude]
  bufferMeters: number;
}

export interface UpdateGeofenceRequest {
  coordinates?: number[][];
  bufferMeters?: number;
}

export interface GeofenceHistoryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
