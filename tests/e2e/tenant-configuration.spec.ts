import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/tenant-configuration";
const tenantId = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";
const otherUserId = "99999999-9999-4999-8999-999999999999";
const basicPlanId = "33333333-3333-4333-8333-333333333333";
const proPlanId = "44444444-4444-4444-8444-444444444444";

function api(data: unknown) {
  return { success: true, message: "Success", data };
}

async function seedUser(
  page: Page,
  role: string,
  userId: string,
  activeTenantId: string | null,
  permissions: string[] = [],
) {
  await page.addInitScript(({ seededRole, seededUserId, seededTenantId, seededPermissions }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "tenant-config-e2e-access");
    localStorage.setItem("fams_refresh_token", "tenant-config-e2e-refresh");
    localStorage.setItem("fams_user", JSON.stringify({
      id: seededUserId,
      email: "operator@example.com",
      emailVerified: true,
      phone: null,
      phoneVerified: false,
      displayName: "Tenant Operator",
      avatarUrl: null,
      active: true,
      createdAt: now,
      updatedAt: now,
      role: seededRole,
      tenantId: seededTenantId,
      permissions: seededPermissions,
      memberships: seededTenantId ? [{
        id: "membership-1",
        userId: seededUserId,
        roleId: "role-1",
        roleName: seededRole,
        tenantId: seededTenantId,
        tenantName: "Acme Việt Nam",
        permissions: seededPermissions,
      }] : [],
    }));
  }, {
    seededRole: role,
    seededUserId: userId,
    seededTenantId: activeTenantId,
    seededPermissions: permissions,
  });
}

const detail = {
  id: tenantId,
  name: "Acme Việt Nam",
  slug: "acme-vn",
  domain: "acme.vn",
  logoUrl: null,
  industry: "construction",
  countryCode: "VN",
  timezone: "Asia/Ho_Chi_Minh",
  locale: "vi-VN",
  status: "active",
  ownerId,
  createdAt: "2026-07-01T00:00:00Z",
  planName: "basic",
  planDisplayName: "Basic",
  subscriptionStatus: "ACTIVE",
  billingCycle: "MONTHLY",
  subscriptionStartedAt: "2026-07-01T00:00:00Z",
  subscriptionExpiresAt: null,
  maxEmployees: 50,
  maxSites: null,
  maxStorageGb: 10,
  maxRandomChecksPerMonth: 100,
  currentEmployeeCount: 42,
  currentSiteCount: 3,
  currentMonthRandomChecks: 81,
};

const settings = {
  id: "settings-1",
  tenantId,
  dateFormat: "DD/MM/YYYY",
  timeFormat: "HH:mm",
  brandPrimaryColor: "#2563EB",
  brandSecondaryColor: "#10B981",
  brandAccentColor: "#F59E0B",
  employeeCodePrefix: "EMP",
  employeeCodePadding: 4,
  updatedAt: "2026-07-20T00:00:00Z",
};

const plans = [
  {
    id: basicPlanId,
    name: "basic",
    displayName: "Basic",
    description: "Basic plan",
    priceMonthly: 100000,
    priceYearly: 1000000,
    isActive: true,
    sortOrder: 1,
    createdAt: detail.createdAt,
    updatedAt: detail.createdAt,
  },
  {
    id: proPlanId,
    name: "pro",
    displayName: "Pro",
    description: "Pro plan",
    priceMonthly: 300000,
    priceYearly: 3000000,
    isActive: true,
    sortOrder: 2,
    createdAt: detail.createdAt,
    updatedAt: detail.createdAt,
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    if (route.request().url().includes("/notifications")) {
      return route.fulfill({
        json: api({
          items: [],
          unreadCount: 0,
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        }),
      });
    }
    return route.fulfill({ json: api(null) });
  });
});

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

test("owner sửa settings, thấy usage và nhận nguyên văn cảnh báo self-lockout", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN", ownerId, tenantId);
  let settingsPatch: Record<string, unknown> = {};
  let subscriptionWriteCalls = 0;
  const selfLockMessage = "Thay đổi này sẽ loại IP hiện tại khỏi whitelist và khóa quyền truy cập của bạn.";

  await page.route(`**/api/v1/tenants/${tenantId}/detail`, (route) =>
    route.fulfill({ json: api(detail) }));
  await page.route(`**/api/v1/tenants/${tenantId}/settings`, async (route) => {
    if (route.request().method() === "PATCH") {
      settingsPatch = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({ ...settings, ...settingsPatch }) });
    }
    return route.fulfill({ json: api(settings) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/ip-whitelists?*`, (route) => route.fulfill({
    json: api({
      content: [{
        id: "ip-entry-1",
        tenantId,
        ipAddress: "192.168.1.15/24",
        label: "Văn phòng",
        scope: "all",
        isActive: true,
        createdAt: detail.createdAt,
      }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    }),
  }));
  await page.route(`**/api/v1/tenants/${tenantId}/ip-whitelists/ip-entry-1`, (route) =>
    route.fulfill({
      status: 400,
      json: {
        success: false,
        message: selfLockMessage,
        userMessage: selfLockMessage,
        errorCode: "INVALID_ARGUMENT",
        data: null,
      },
    }));
  page.on("request", (request) => {
    if (
      request.url().includes(`/tenants/${tenantId}/subscription`)
      && ["POST", "PATCH"].includes(request.method())
    ) subscriptionWriteCalls += 1;
  });

  await page.goto("/customer/settings/tenant");
  await expect(page.getByText("Bạn là chủ sở hữu công ty")).toBeVisible();

  await page.getByRole("tab", { name: /Giao diện & định dạng/ }).click();
  await page.getByLabel("Màu phụ").fill("#112233");
  await page.getByRole("button", { name: "Lưu thiết lập" }).click();
  await expect.poll(() => settingsPatch).toEqual({ brandSecondaryColor: "#112233" });

  await page.getByRole("tab", { name: /Bảo mật IP/ }).click();
  await expect(page.getByText("Whitelist đang được áp dụng")).toBeVisible();
  await page.getByRole("switch", { name: "Bật hoặc tắt 192.168.1.15/24" }).click();
  await expect(page.getByText(selfLockMessage)).toBeVisible();

  await page.getByRole("tab", { name: /Gói & mức sử dụng/ }).click();
  await expect(page.getByText("42 / 50")).toBeVisible();
  await expect(page.getByText("3 / Không giới hạn")).toBeVisible();
  await expect(page.getByRole("link", { name: "Liên hệ nâng cấp" })).toBeVisible();
  expect(subscriptionWriteCalls).toBe(0);
  await page.screenshot({ path: `${evidenceDir}/01-owner-usage.png`, fullPage: true });
});

test("TENANT_ADMIN không phải owner không thấy công cụ quản trị owner-only", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN", otherUserId, tenantId);
  await page.route(`**/api/v1/tenants/${tenantId}/settings`, (route) =>
    route.fulfill({ json: api(settings) }));
  await page.route(`**/api/v1/tenants/${tenantId}/detail`, (route) => route.fulfill({
    status: 403,
    json: {
      success: false,
      message: "Only the tenant owner can access operational detail",
      errorCode: "ACCESS_DENIED",
      data: null,
    },
  }));

  await page.goto("/customer/settings/tenant");
  await expect(page.getByText("Chỉ chủ sở hữu được quản trị công ty")).toBeVisible();
  await expect(page.getByRole("link", { name: "Cấu hình Công ty" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: /Hồ sơ công ty/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Lưu/ })).toHaveCount(0);
  await page.screenshot({ path: `${evidenceDir}/02-non-owner-denied.png`, fullPage: true });
});

test("Platform Admin chỉ xem settings nhưng đổi gói tenant bằng PATCH subscription", async ({ page }) => {
  await seedUser(page, "PLATFORM_ADMIN", otherUserId, null);
  let subscriptionPatch: Record<string, unknown> = {};

  await page.route(`**/api/v1/tenants/${tenantId}/detail`, (route) =>
    route.fulfill({ json: api(detail) }));
  await page.route(`**/api/v1/tenants/${tenantId}/settings`, (route) =>
    route.fulfill({ json: api(settings) }));
  await page.route(`**/api/v1/tenants/${tenantId}/subscription`, async (route) => {
    if (route.request().method() === "PATCH") {
      subscriptionPatch = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({
        id: "subscription-1",
        tenantId,
        planId: proPlanId,
        planName: "Pro",
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        startedAt: detail.createdAt,
        createdAt: detail.createdAt,
        updatedAt: detail.createdAt,
      }) });
    }
    return route.fulfill({ json: api({
      id: "subscription-1",
      tenantId,
      planId: basicPlanId,
      planName: "Basic",
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      startedAt: detail.createdAt,
      createdAt: detail.createdAt,
      updatedAt: detail.createdAt,
    }) });
  });
  await page.route("**/api/v1/plans?*", (route) => route.fulfill({
    json: api({
      content: plans,
      page: 0,
      size: 100,
      totalElements: plans.length,
      totalPages: 1,
      first: true,
      last: true,
    }),
  }));

  await page.goto(`/admin/tenants/${tenantId}`);
  await page.getByRole("tab", { name: /Giao diện/ }).click();
  await expect(page.getByText("Chế độ chỉ xem")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu thiết lập" })).toHaveCount(0);

  await page.getByRole("tab", { name: /Gói dịch vụ/ }).click();
  await page.getByRole("button", { name: "Thay đổi gói / Trạng thái" }).click();
  await page.getByRole("combobox", { name: "Chọn gói dịch vụ" }).click();
  await page.getByText("Pro", { exact: true }).last().click();
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect.poll(() => subscriptionPatch).toMatchObject({ planId: proPlanId });
  await page.screenshot({ path: `${evidenceDir}/03-admin-subscription.png`, fullPage: true });
});

test("Platform Admin tắt định nghĩa gói và chọn gói đích để migrate tenant", async ({ page }) => {
  await seedUser(page, "PLATFORM_ADMIN", otherUserId, null);
  let planPatch: Record<string, unknown> = {};

  await page.route("**/api/v1/plans?*", (route) => route.fulfill({
    json: api({
      content: plans,
      page: 0,
      size: 50,
      totalElements: plans.length,
      totalPages: 1,
      first: true,
      last: true,
    }),
  }));
  await page.route(`**/api/v1/plans/${basicPlanId}`, async (route) => {
    planPatch = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: api({ ...plans[0], ...planPatch }) });
  });

  await page.goto("/admin/plans");
  await page.getByRole("switch", { name: "Bật hoặc tắt gói Basic" }).click();
  await expect(page.getByText("Kiểm tra tenant đang sử dụng gói")).toBeVisible();
  await page.getByRole("combobox", { name: "Gói đích để chuyển tenant" }).click();
  await page.getByText("Pro", { exact: true }).last().click();
  await page.getByRole("button", { name: "Xác nhận tắt gói" }).click();

  await expect.poll(() => planPatch).toEqual({
    isActive: false,
    migrateToPlanId: proPlanId,
  });
  await page.screenshot({ path: `${evidenceDir}/04-plan-migration.png`, fullPage: true });
});
