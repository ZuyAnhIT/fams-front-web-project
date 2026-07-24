export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  status: "active" | "inactive" | "suspended" | "trial" | "cancelled";
  industry?: string | null;
  countryCode?: string | null;
  timezone: string;
  locale: string;
  currencyCode?: string | null;
  logoUrl?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TenantStatus = "active" | "inactive" | "suspended" | "trial" | "cancelled";

export type TenantSortField = "name" | "slug" | "status" | "createdAt" | "updatedAt";

export interface TenantListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  industry?: string;
  countryCode?: string;
  sortBy?: TenantSortField;
  sortDir?: "asc" | "desc";
}

export interface TenantOperationalDetail {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logoUrl?: string | null;
  industry?: string | null;
  countryCode?: string | null;
  timezone?: string | null;
  locale?: string | null;
  status: TenantStatus;
  ownerId: string;
  createdAt: string;
  planName?: string | null;
  planDisplayName?: string | null;
  subscriptionStatus?: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED" | null;
  billingCycle?: "MONTHLY" | "YEARLY" | null;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
  maxEmployees?: number | null;
  maxSites?: number | null;
  maxStorageGb?: number | null;
  maxRandomChecksPerMonth?: number | null;
  currentEmployeeCount: number;
  currentSiteCount: number;
  currentMonthRandomChecks: number;
}

export interface TenantSettingsResponse {
  dateFormat: string;
  timeFormat: string;
  brandPrimaryColor?: string | null;
  brandSecondaryColor?: string | null;
  customCss?: string | null;
}

export interface IpWhitelistResponse {
  id: string;
  tenantId: string;
  ipAddress: string;
  label?: string | null;
  scope: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  domain?: string;
  industry?: string;
  countryCode?: string;
  timezone?: string;
  locale?: string;
  /** Chỉ dùng ở chế độ platform provisioning. */
  ownerUserId?: string;
  ownerEmail?: string;
  planId?: string;
  currencyCode?: string;
}

export interface UpdateTenantPayload {
  name?: string;
  domain?: string;
  logoUrl?: string;
  industry?: string;
  countryCode?: string;
  timezone?: string;
  locale?: string;
  currencyCode?: string;
}

export interface UpdateTenantSettingsPayload {
  dateFormat?: string;
  timeFormat?: string;
  brandPrimaryColor?: string;
  brandSecondaryColor?: string;
  customCss?: string;
}

export interface CreateIpWhitelistPayload {
  ipAddress: string;
  label?: string;
  scope?: string;
}

export interface UpdateIpWhitelistPayload {
  label?: string;
  scope?: string;
  isActive?: boolean;
}
