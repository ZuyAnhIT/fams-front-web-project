export interface PlanResponse {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  isActive: boolean;
  sortOrder: number;
  stripeProductId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimitsResponse {
  id: string;
  planId: string;
  maxEmployees?: number;
  maxSites?: number;
  maxStorageGb?: number;
  maxRandomChecksPerMonth?: number;
  maxExportsPerMonth?: number;
}

export interface CreatePlanPayload {
  name: string;
  displayName: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  isActive?: boolean;
  sortOrder?: number;
  stripeProductId?: string;
}

export type UpdatePlanPayload = Partial<CreatePlanPayload> & {
  migrateToPlanId?: string;
};

export interface UpdatePlanLimitsPayload {
  maxEmployees?: number | null;
  maxSites?: number | null;
  maxStorageGb?: number | null;
  maxRandomChecksPerMonth?: number | null;
  clearMaxEmployees?: boolean;
  clearMaxSites?: boolean;
  clearMaxStorageGb?: boolean;
  clearMaxRandomChecksPerMonth?: boolean;
}

export interface SubscriptionResponse {
  id: string;
  tenantId: string;
  planId: string;
  planName?: string;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  billingCycle: "MONTHLY" | "YEARLY";
  startedAt: string;
  expiresAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignSubscriptionPayload {
  planId: string;
  billingCycle: "MONTHLY" | "YEARLY";
}

export interface UpdateSubscriptionPayload {
  planId?: string;
  status?: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  billingCycle?: "MONTHLY" | "YEARLY";
  startedAt?: string;
  expiresAt?: string;
  clearExpiresAt?: boolean;
}
