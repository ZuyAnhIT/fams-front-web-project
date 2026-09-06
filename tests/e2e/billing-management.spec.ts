import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/billing-management";
const tenantId = "e50c8ca6-8a6e-4c0d-a111-111111111111";
const api = (data: unknown) => ({ success: true, message: "Success", data });
const pageData = (content: unknown[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true });
mkdirSync(evidenceDir, { recursive: true });

const paidOrder = {
  id: "10000000-0000-4000-8000-000000000012",
  orderCode: 100012,
  tenantId,
  tenantName: "Công ty Xây dựng FOFO",
  planId: "20000000-0000-4000-8000-000000000004",
  planName: "enterprise",
  planDisplayName: "Doanh nghiệp",
  billingCycle: "MONTHLY",
  amount: 40000,
  amountPaid: 40000,
  currency: "VND",
  status: "PAID",
  paymentLinkId: "payos-100012",
  paymentReference: "FT260905100012",
  providerStatus: "PAID",
  expiresAt: "2026-09-05T21:34:39+07:00",
  paidAt: "2026-09-05T21:04:39+07:00",
  subscriptionAppliedAt: "2026-09-05T21:04:40+07:00",
  paymentReceiptAvailable: true,
  paymentReceiptNumber: "PT-202609-100012",
  paymentReceiptIssuedAt: "2026-09-05T21:04:39+07:00",
  invoiceStatus: "PENDING_ISSUANCE",
  createdAt: "2026-09-05T20:59:39+07:00",
  updatedAt: "2026-09-05T21:04:40+07:00",
};

const cancelledOrder = {
  ...paidOrder,
  id: "10000000-0000-4000-8000-000000000014",
  orderCode: 100014,
  planId: "20000000-0000-4000-8000-000000000001",
  planName: "starter",
  planDisplayName: "Khởi đầu",
  amount: 10000,
  amountPaid: 0,
  status: "CANCELLED",
  providerStatus: "CANCELLED",
  paymentReference: undefined,
  paidAt: undefined,
  subscriptionAppliedAt: undefined,
  paymentReceiptAvailable: false,
  paymentReceiptNumber: undefined,
  paymentReceiptIssuedAt: undefined,
  invoiceStatus: "NOT_ELIGIBLE",
  cancelledAt: "2026-09-06T09:15:15+07:00",
  createdAt: "2026-09-06T09:15:15+07:00",
  updatedAt: "2026-09-06T09:16:00+07:00",
};

async function seedSession(page: Page, role: "PLATFORM_ADMIN" | "TENANT_ADMIN") {
  await page.addInitScript(({ seededRole, seededTenantId }) => {
    const isTenant = seededRole === "TENANT_ADMIN";
    localStorage.setItem("fams_access_token", "billing-e2e");
    localStorage.setItem("fams_refresh_token", "billing-e2e-r");
    localStorage.setItem("fams_user", JSON.stringify({
      id: isTenant ? "tenant-owner" : "platform-admin",
      email: isTenant ? "owner@fofo.vn" : "platform@fams.vn",
      displayName: isTenant ? "Nguyễn Hoàng Nam" : "Platform Admin",
      emailVerified: true,
      active: true,
      role: seededRole,
      tenantId: isTenant ? seededTenantId : null,
      permissions: isTenant ? [] : ["billing:list", "billing:read", "billing:update"],
      memberships: isTenant ? [{ id: "m1", tenantId: seededTenantId, tenantName: "Công ty Xây dựng FOFO", roleName: "TENANT_ADMIN", siteIds: [] }] : [],
      createdAt: "2026-09-01T00:00:00+07:00",
      updatedAt: "2026-09-01T00:00:00+07:00",
    }));
  }, { seededRole: role, seededTenantId: tenantId });
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const url = route.request().url();
    if (url.includes("/notifications")) return route.fulfill({ json: api({ items: [], unreadCount: 0, totalElements: 0 }) });
    if (/\/plans\/[^/]+\/limits/.test(url)) return route.fulfill({ json: api({ maxEmployees: 100, maxSites: 10, maxStorageGb: 10, maxRandomChecksPerMonth: 500 }) });
    if (url.includes("/plans")) return route.fulfill({ json: api(pageData([
      { id: "20000000-0000-4000-8000-000000000001", name: "starter", displayName: "Khởi đầu", description: "Cho đội nhỏ", priceMonthly: 10000, priceYearly: 100000, isActive: true, sortOrder: 1, createdAt: "2026-09-01", updatedAt: "2026-09-01" },
      { id: "20000000-0000-4000-8000-000000000004", name: "enterprise", displayName: "Doanh nghiệp", description: "Cho doanh nghiệp", priceMonthly: 40000, priceYearly: 400000, isActive: true, sortOrder: 4, createdAt: "2026-09-01", updatedAt: "2026-09-01" },
    ])) });
    if (/\/tenants\/[^/]+\/detail/.test(url)) return route.fulfill({ json: api({ id: tenantId, name: "Công ty Xây dựng FOFO", ownerId: "tenant-owner", status: "ACTIVE", planId: paidOrder.planId, planDisplayName: "Doanh nghiệp", subscriptionStatus: "ACTIVE", billingCycle: "MONTHLY", subscriptionExpiresAt: "2026-10-05T21:04:39+07:00" }) });
    if (/\/tenants\/[^/]+\/billing-orders/.test(url)) return route.fulfill({ json: api(pageData([paidOrder, cancelledOrder])) });
    if (url.includes("/billing-orders")) return route.fulfill({ json: api(pageData([paidOrder, cancelledOrder])) });
    return route.fulfill({ json: api(null) });
  });
});

test("platform billing uses company names, business filters and paid document details", async ({ page }) => {
  await seedSession(page, "PLATFORM_ADMIN");
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/admin/billing");
  await expect(page.getByText("Công ty Xây dựng FOFO").first()).toBeVisible();
  await expect(page.getByPlaceholder("Tên công ty, mã đơn, gói hoặc mã giao dịch")).toBeVisible();
  await expect(page.getByText(tenantId)).toHaveCount(0);

  await page.getByRole("row", { name: /#100012/ }).getByRole("button", { name: "Chi tiết" }).click();
  await expect(page.getByText("Chi tiết thanh toán #100012")).toBeVisible();
  await expect(page.getByText("PT-202609-100012")).toBeVisible();
  await expect(page.getByText("Hóa đơn: Chờ phát hành")).toBeVisible();
  await expect(page.getByText(/không thay thế hóa đơn điện tử\/hóa đơn VAT/i)).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${evidenceDir}/01-platform-paid-detail.png`, fullPage: true });
});

test("company billing distinguishes cancelled order from paid receipt", async ({ page }) => {
  await seedSession(page, "TENANT_ADMIN");
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/customer/billing");
  await expect(page.getByRole("heading", { name: "Lịch sử thanh toán" })).toBeVisible();

  await page.getByRole("row", { name: /#100014/ }).getByRole("button", { name: "Chi tiết" }).click();
  await expect(page.getByText("Chưa phát sinh chứng từ thanh toán")).toBeVisible();
  await expect(page.getByText("Hóa đơn: Chưa phát sinh")).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${evidenceDir}/02-company-cancelled-detail.png`, fullPage: true });
});
