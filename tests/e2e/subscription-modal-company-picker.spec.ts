import { mkdirSync } from "node:fs";
import { test, type Page } from "@playwright/test";

/**
 * Visual checks for:
 *  - #04: a single-company user can reach the company picker / "create company" flow from
 *    the header account menu.
 *  - #05: the "Cập nhật gói dịch vụ" modal on the platform-admin tenant detail page.
 */

const evidenceDir = "docs/test-evidence/subscription-company-picker";
const api = (data: unknown) => ({ success: true, message: "Success", data });
const tenantId = "11111111-1111-4111-8111-111111111111";

mkdirSync(evidenceDir, { recursive: true });

async function seed(page: Page, role: "PLATFORM_ADMIN" | "TENANT_ADMIN") {
  await page.addInitScript(
    ({ seededRole, tid }) => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", "sub-e2e");
      localStorage.setItem("fams_refresh_token", "sub-e2e-r");
      localStorage.setItem(
        "fams_user",
        JSON.stringify({
          id: "user-e2e",
          email: "e2e@fams.vn",
          displayName: "Trần Quốc Bảo",
          emailVerified: true,
          active: true,
          createdAt: now,
          updatedAt: now,
          role: seededRole,
          tenantId: seededRole === "TENANT_ADMIN" ? tid : null,
          permissions:
            seededRole === "PLATFORM_ADMIN"
              ? ["tenants:list", "tenants:read", "tenants:update", "plans:list", "subscriptions:manage"]
              : ["employees:list"],
          memberships:
            seededRole === "TENANT_ADMIN"
              ? [{ id: "m", userId: "user-e2e", roleId: "ta", tenantId: tid, tenantName: "Công ty Xây dựng Long Hậu", siteIds: [], roleName: "TENANT_ADMIN" }]
              : [],
        }),
      );
    },
    { seededRole: role, tid: tenantId },
  );
}

const plans = [
  { id: "p1", name: "starter", displayName: "Starter", description: "Cho đội nhỏ", priceMonthly: 0, priceYearly: 0, isActive: true, sortOrder: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "p2", name: "growth", displayName: "Growth", description: "Doanh nghiệp đang mở rộng", priceMonthly: 1490000, priceYearly: 14900000, isActive: true, sortOrder: 2, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "p3", name: "enterprise", displayName: "Enterprise", description: "Không giới hạn quy mô", priceMonthly: 4990000, priceYearly: 49900000, isActive: true, sortOrder: 3, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
];

const subscription = {
  id: "s1", tenantId, planId: "p2", planName: "Growth", status: "ACTIVE",
  billingCycle: "MONTHLY", startedAt: "2026-06-01T00:00:00Z", expiresAt: "2026-12-31T17:00:00Z",
};

const tenantDetail = {
  id: tenantId, name: "Công ty Xây dựng Long Hậu", slug: "long-hau", industry: "Xây dựng",
  status: "ACTIVE", ownerId: "user-e2e", createdAt: "2026-01-01T00:00:00Z",
  planName: "growth", planDisplayName: "Growth", subscriptionStatus: "ACTIVE", billingCycle: "MONTHLY",
  subscriptionStartedAt: "2026-06-01T00:00:00Z", subscriptionExpiresAt: "2026-12-31T17:00:00Z",
  currentEmployeeCount: 42, currentSiteCount: 5, currentMonthRandomChecks: 12, currentStorageGb: 1.2,
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const url = route.request().url();
    if (url.includes("/notifications")) return route.fulfill({ json: api({ items: [], unreadCount: 0, totalElements: 0 }) });
    if (url.includes("/plans")) return route.fulfill({ json: api({ content: plans, page: 0, size: 100, totalElements: plans.length, totalPages: 1, first: true, last: true }) });
    if (/\/tenants\/[^/]+\/subscription/.test(url)) return route.fulfill({ json: api(subscription) });
    if (/\/tenants\/[^/]+\/detail/.test(url)) return route.fulfill({ json: api(tenantDetail) });
    if (url.includes("/roles/me") || url.includes("/me/roles")) return route.fulfill({ json: api([{ tenantId, tenantName: "Công ty Xây dựng Long Hậu", roleName: "TENANT_ADMIN" }]) });
    return route.fulfill({ json: api(null) });
  });
});

test("#05 - subscription update modal", async ({ page }) => {
  await seed(page, "PLATFORM_ADMIN");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/admin/tenants/${tenantId}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("tab", { name: /subscription|gói/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Thay đổi gói/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${evidenceDir}/subscription-modal-1280.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${evidenceDir}/subscription-modal-390.png` });
});

test("#04 - single-company user reaches company picker from account menu", async ({ page }) => {
  await seed(page, "TENANT_ADMIN");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/customer/dashboard");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Mở menu tài khoản/i }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${evidenceDir}/account-menu-1280.png` });
  await page.getByRole("menuitem", { name: /Công ty của tôi/i }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${evidenceDir}/select-company-1280.png`, fullPage: true });
});
