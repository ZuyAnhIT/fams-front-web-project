export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  status: "active" | "inactive" | "suspended";
  industry?: string | null;
  countryCode?: string | null;
  timezone: string;
  locale: string;
  currency: string;
  maxEmployees: number;
  maxSites: number;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettingsResponse {
  dateFormat: string;
  timeFormat: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
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
  currencyCode?: string;
}

export interface UpdateTenantPayload {
  name?: string;
  domain?: string;
  industry?: string;
  countryCode?: string;
  timezone?: string;
  locale?: string;
  currencyCode?: string;
}

export interface UpdateTenantSettingsPayload {
  dateFormat?: string;
  timeFormat?: string;
  primaryColor?: string;
  secondaryColor?: string;
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
