export type SavedFilterParams = Record<string, unknown>;

export interface SavedFilter {
  id: string;
  resourceType: string;
  name: string;
  filterParams: SavedFilterParams;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedFilterPayload {
  resourceType: string;
  name: string;
  filterParams: SavedFilterParams;
  isDefault: boolean;
}

export interface UpdateSavedFilterPayload {
  name?: string;
  filterParams?: SavedFilterParams;
  isDefault?: boolean;
}
