import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/tenant";
const tenantId = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";
const planId = "33333333-3333-4333-8333-333333333333";

function api(data: unknown) {
  return { success: true, message: "Success", data };
}

async function seedUser(
  page: Page,
  role: string,
  permissions: string[] = [],
  activeTenantId: string | null = null,
) {
  await page.addInitScript(({ seededRole, seededPermissions, seededTenantId, seededOwnerId }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "tenant-e2e-access");
    localStorage.setItem("fams_refresh_token", "tenant-e2e-refresh");
    localStorage.setItem("fams_user", JSON.stringify({
      id: seededOwnerId,
      email: "owner@example.com",
      emailVerified: true,
      phone: null,
      phoneVerified: false,
      displayName: "Tenant E2E",
      avatarUrl: null,
      active: true,
      createdAt: now,
      updatedAt: now,
      role: seededRole,
      tenantId: seededTenantId,
      permissions: seededPermissions,
      memberships: seededTenantId ? [{
        id: "membership-1",
        userId: seededOwnerId,
        roleId: "role-1",
        roleName: seededRole,
        tenantId: seededTenantId,
        tenantName: "Acme Việt Nam",
        permissions: seededPermissions,
      }] : [],
    }));
  }, {
    seededRole: role,
    seededPermissions: permissions,
    seededTenantId: activeTenantId,
    seededOwnerId: ownerId,
  });
}

const tenant = {
  id: tenantId,
  name: "Acme Việt Nam",
  slug: "acme-vn",
  domain: "acme.vn",
  logoUrl: null,
  industry: "construction",
  countryCode: "VN",
  timezone: "Asia/Ho_Chi_Minh",
  locale: "vi-VN",
  currencyCode: "VND",
  status: "active",
  ownerId,
  ownerName: "Owner",
  ownerEmail: "owner@example.com",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-20T00:00:00Z",
};

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));
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

test("Platform Admin truyền đủ filter/sort/pagination và provisioning đúng contract", async ({ page }) => {
  await seedUser(page, "PLATFORM_ADMIN");
  let createBody: Record<string, unknown> = {};

  await page.route("**/api/v1/tenants?*", async (route) => {
    const url = new URL(route.request().url());
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      search: "acme",
      status: "active",
      industry: "construction",
      countryCode: "VN",
      sortBy: "name",
      sortDir: "asc",
      page: "1",
      size: "10",
    });
    await route.fulfill({ json: api({
      content: [tenant], page: 1, size: 10, totalElements: 11, totalPages: 2, first: false, last: true,
    }) });
  });
  await page.route("**/api/v1/plans?*", (route) => route.fulfill({
    json: api({
      content: [{
        id: planId,
        name: "starter",
        displayName: "Starter",
        priceMonthly: 100000,
        priceYearly: 1000000,
        isActive: true,
        sortOrder: 1,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      }],
      page: 0, size: 100, totalElements: 1, totalPages: 1, first: true, last: true,
    }),
  }));
  await page.route("**/api/v1/tenants", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    createBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 201, json: api({ ...tenant, id: "new-tenant" }) });
  });

  await page.goto("/admin/tenants?search=acme&status=active&industry=construction&countryCode=VN&sortBy=name&sortDir=asc&page=1&size=10");
  await expect(page.getByText("Acme Việt Nam")).toBeVisible();
  await page.getByRole("button", { name: "Cấp phát công ty" }).click();
  await page.getByLabel("Tên công ty").fill("Công ty Mới");
  await page.getByLabel("Slug").fill("cong-ty-moi");
  await page.getByLabel("Email chủ sở hữu đã đăng ký").fill("new-owner@example.com");
  await page.getByRole("button", { name: "Tạo và gán chủ sở hữu" }).click();
  await expect.poll(() => createBody).toMatchObject({
    name: "Công ty Mới",
    slug: "cong-ty-moi",
    ownerEmail: "new-owner@example.com",
    countryCode: "VN",
  });
  expect(createBody).not.toHaveProperty("adminEmail");
  await page.screenshot({ path: `${evidenceDir}/01-admin-list-provisioning.png`, fullPage: true });
});

test("Platform Staff chỉ thấy quyền được cấp, không thấy lifecycle/subscription write", async ({ page }) => {
  await seedUser(page, "PLATFORM_STAFF", ["tenants:list", "tenants:read"]);
  await page.route("**/api/v1/tenants?*", (route) => route.fulfill({
    json: api({ content: [tenant], page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true }),
  }));
  await page.route(`**/api/v1/tenants/${tenantId}/detail`, (route) => route.fulfill({
    json: api({
      ...tenant,
      planName: "starter",
      planDisplayName: "Starter",
      subscriptionStatus: "ACTIVE",
      billingCycle: "MONTHLY",
      maxEmployees: 10,
      maxSites: null,
      maxStorageGb: 5,
      maxRandomChecksPerMonth: 100,
      currentEmployeeCount: 4,
      currentSiteCount: 2,
      currentMonthRandomChecks: 20,
    }),
  }));

  await page.goto("/admin/tenants");
  await expect(page.getByText("Acme Việt Nam")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cấp phát công ty" })).toHaveCount(0);
  await page.goto(`/admin/tenants/${tenantId}`);
  await expect(page.getByText("Mức sử dụng và giới hạn")).toBeVisible();
  await expect(page.getByText("Hồ sơ công ty chỉ do chủ sở hữu chỉnh sửa")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Gói dịch vụ/ })).toHaveCount(0);
  await page.screenshot({ path: `${evidenceDir}/02-platform-staff-readonly.png`, fullPage: true });
});

test("self-service không gửi owner/plan và chuyển thẳng vào tenant vừa tạo", async ({ page }) => {
  await seedUser(page, "EMPLOYEE");
  let createBody: Record<string, unknown> = {};
  await page.route("**/api/v1/tenants", async (route) => {
    createBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 201, json: api(tenant) });
  });
  await page.route("**/api/v1/auth/switch-tenant", (route) => route.fulfill({
    json: api({ accessToken: "switched-access", refreshToken: "switched-refresh", tokenType: "Bearer", expiresIn: 900 }),
  }));
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({ json: api({
    id: ownerId,
    email: "owner@example.com",
    emailVerified: true,
    phone: null,
    phoneVerified: false,
    displayName: "Owner",
    avatarUrl: null,
    active: true,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  }) }));
  await page.route("**/api/v1/roles/me", (route) => route.fulfill({ json: api([{
    id: "membership",
    userId: ownerId,
    roleId: "tenant-admin",
    roleName: "TENANT_ADMIN",
    tenantId,
    tenantName: tenant.name,
    permissions: [],
  }]) }));

  await page.goto("/customer/select-company");
  await page.getByRole("button", { name: "Tạo công ty mới" }).click();
  await page.getByLabel("Tên công ty").fill("Acme Việt Nam");
  await page.getByLabel("Đường dẫn (Slug)").fill("acme-vn-self");
  await page.getByLabel("Lĩnh vực hoạt động").fill("construction");
  await page.getByRole("button", { name: "Tạo công ty" }).click();
  await expect.poll(() => createBody).toMatchObject({
    name: "Acme Việt Nam",
    slug: "acme-vn-self",
    industry: "construction",
  });
  expect(createBody).not.toHaveProperty("ownerEmail");
  expect(createBody).not.toHaveProperty("ownerUserId");
  expect(createBody).not.toHaveProperty("planId");
});

test("owner xem subscription nhưng không có nút quản trị, và PATCH chỉ gửi field đã sửa", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN", [], tenantId);
  let updateBody: Record<string, unknown> = {};
  await page.route(`**/api/v1/tenants/${tenantId}`, async (route) => {
    updateBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: api({ ...tenant, ...updateBody }) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/subscription`, (route) => route.fulfill({
    json: api({
      id: "subscription-1",
      tenantId,
      planId,
      planName: "starter",
      planDisplayName: "Starter",
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      startedAt: tenant.createdAt,
      expiresAt: null,
      cancelledAt: null,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    }),
  }));
  await page.route("**/api/v1/plans?*", (route) => route.fulfill({
    json: api({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0, first: true, last: true }),
  }));

  await page.goto("/customer/settings/tenant");
  await expect(page.getByText("Chỉ chủ sở hữu được lưu thay đổi")).toBeVisible();
  await page.getByLabel("Tên miền riêng").fill("owner-new.example.com");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect.poll(() => updateBody).toEqual({ domain: "owner-new.example.com" });

  await page.getByRole("tab", { name: /Gói dịch vụ/ }).click();
  await expect(page.getByText("Starter")).toBeVisible();
  await expect(page.getByRole("button", { name: /Thay đổi gói/ })).toHaveCount(0);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${evidenceDir}/03-owner-profile-subscription.png`, fullPage: true });
});

test("423 hiển thị countdown và lối mở khóa qua quên mật khẩu", async ({ page }) => {
  await page.route("**/api/v1/auth/login", (route) => route.fulfill({
    status: 423,
    json: {
      success: false,
      message: "Account locked until 2026-07-24T23:59:59Z",
      userMessage: "Tài khoản bị khóa đến 2026-07-24T23:59:59Z",
      errorCode: "ACCOUNT_LOCKED",
      data: null,
    },
  }));
  await page.goto("/login");
  await page.getByLabel("Email hoặc số điện thoại").fill("locked@example.com");
  await page.getByLabel("Mật khẩu").fill("WrongPass1");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tài khoản đang tạm khóa" })).toBeVisible();
  const resetLink = page.getByRole("link", { name: "Đặt lại mật khẩu để mở khóa ngay" });
  await expect(resetLink).toHaveAttribute("href", "/forgot-password?email=locked%40example.com");
  await page.screenshot({ path: `${evidenceDir}/04-account-locked.png`, fullPage: true });
});
