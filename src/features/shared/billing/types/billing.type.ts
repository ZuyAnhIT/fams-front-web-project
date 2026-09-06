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
export type BillingInvoiceStatus = "NOT_ELIGIBLE" | "PAYMENT_REVIEW" | "PENDING_ISSUANCE" | "ISSUED" | "FAILED";

export interface BillingOrder {
  id: string;
  orderCode: number;
  tenantId: string;
  tenantName: string;
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
  paymentReceiptAvailable: boolean;
  paymentReceiptNumber?: string;
  paymentReceiptIssuedAt?: string;
  invoiceStatus: BillingInvoiceStatus;
  invoiceNumber?: string;
  invoiceIssuedAt?: string;
  invoiceLookupUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformBillingQuery {
  search?: string;
  tenantId?: string;
  status?: BillingOrderStatus;
  billingCycle?: BillingCycle;
  sortBy?: "createdAt" | "amount" | "paidAt" | "company" | "status" | "orderCode";
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
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
