export interface CreateGeofenceRequest {
  coordinates: number[][]; // [longitude, latitude]
  bufferMeters: number;
}

export interface UpdateGeofenceRequest {
  coordinates?: number[][];
  bufferMeters?: number;
}
