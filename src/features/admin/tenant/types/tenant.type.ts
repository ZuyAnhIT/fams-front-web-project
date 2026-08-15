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
  id?: string;
  tenantId?: string;
  dateFormat: string;
  timeFormat: string;
  brandPrimaryColor?: string | null;
  brandSecondaryColor?: string | null;
  brandAccentColor?: string | null;
  employeeCodePrefix?: string | null;
  employeeCodePadding?: number | null;
  updatedAt?: string;
}

export interface IpWhitelistResponse {
  id: string;
  tenantId: string;
  ipAddress: string;
  label?: string | null;
  /** Role bị entry này giới hạn. Rỗng = áp dụng cho mọi role. */
  applicableRoleNames: string[];
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

export interface TransferOwnerPayload {
  newOwnerUserId?: string;
  newOwnerEmail?: string;
}

/** Một người giữ ít nhất 1 role trong tenant — chủ sở hữu, admin, HR, giám sát công trình,
 *  hay nhân viên thường — kể cả khi chưa có hồ sơ Employee (VD chủ mới nhận chuyển giao). */
export interface TenantMember {
  userId: string;
  displayName?: string | null;
  contact?: string | null;
  isOwner: boolean;
  roleNames: string[];
  /** Cùng thứ tự với roleNames — dùng để thu hồi từng role riêng lẻ. */
  userRoleIds: string[];
  hasEmployeeProfile: boolean;
  employeeId?: string | null;
  position?: string | null;
  department?: string | null;
  memberSince?: string | null;
}

export interface UpdateTenantSettingsPayload {
  dateFormat?: string;
  timeFormat?: string;
  brandPrimaryColor?: string;
  brandSecondaryColor?: string;
  brandAccentColor?: string;
  employeeCodePrefix?: string;
  employeeCodePadding?: number;
}

export interface CreateIpWhitelistPayload {
  ipAddress: string;
  label?: string;
  applicableRoleNames?: string[];
}

export interface UpdateIpWhitelistPayload {
  label?: string;
  applicableRoleNames?: string[];
  isActive?: boolean;
}
