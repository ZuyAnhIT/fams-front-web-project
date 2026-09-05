export type BillingCycle = "MONTHLY" | "YEARLY";
export type BillingOrderStatus =
  | "CREATING"
  | "PENDING"
  | "PROCESSING"
  | "UNDERPAID"
  | "PAID"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

export interface BillingOrder {
  id: string;
  orderCode: number;
  tenantId: string;
  planId: string;
  planName: string;
  planDisplayName: string;
  billingCycle: BillingCycle;
  amount: number;
  amountPaid: number;
  currency: "VND";
  status: BillingOrderStatus;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  paymentReference?: string;
  providerStatus?: string;
  failureReason?: string;
  expiresAt: string;
  paidAt?: string;
  cancelledAt?: string;
  subscriptionAppliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillingOrderPayload {
  planId: string;
  billingCycle: BillingCycle;
}

export interface CurrentSubscriptionSummary {
  planId?: string | null;
  planDisplayName?: string | null;
  status?: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED" | null;
  billingCycle?: BillingCycle | null;
  expiresAt?: string | null;
}
