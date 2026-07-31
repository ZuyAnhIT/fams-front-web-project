import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/multi-tenant-switching";
const userId = "10000000-0000-4000-8000-000000000001";
const tenantA = "20000000-0000-4000-8000-000000000001";
const tenantB = "20000000-0000-4000-8000-000000000002";

function api(data: unknown) {
  return { success: true, message: "Success", data };
}

function jwt(tenantId: string, role: string) {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, tenantId, role, isPlatformAdmin: false }),
    "utf8",
  ).toString("base64url");
  return `eyJhbGciOiJub25lIn0.${payload}.signature`;
}

const profile = {
  id: userId,
  email: "multi-tenant@example.com",
  emailVerified: true,
  phone: null,
  phoneVerified: false,
  displayName: "Người dùng đa công ty",
  avatarUrl: null,
  active: true,
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-31T00:00:00Z",
};

const memberships = [
  {
    id: "assignment-a-admin",
    userId,
    roleId: "role-a-admin",
    roleName: "TENANT_ADMIN",
    tenantId: tenantA,
    tenantName: "Công ty Alpha",
    permissions: ["employees:read"],
  },
  {
    id: "assignment-a-hr",
    userId,
    roleId: "role-a-hr",
    roleName: "HR_MANAGER",
    tenantId: tenantA,
    tenantName: "Công ty Alpha",
    permissions: ["employees:write"],
  },
  {
    id: "assignment-b-supervisor",
    userId,
    roleId: "role-b-supervisor",
    roleName: "SITE_SUPERVISOR",
    tenantId: tenantB,
    tenantName: "Công ty Beta",
    permissions: ["sites:read"],
  },
];

async function seedSession(page: Page) {
  await page.addInitScript(
    ({ accessToken, seededUser, seededMemberships, activeTenantId }) => {
      if (sessionStorage.getItem("multi-tenant-e2e-seeded")) return;
      sessionStorage.setItem("multi-tenant-e2e-seeded", "true");
      localStorage.setItem("fams_access_token", accessToken);
      localStorage.setItem("fams_refresh_token", "refresh-a");
      localStorage.setItem(
        "fams_user",
        JSON.stringify({
          ...seededUser,
          role: "TENANT_ADMIN",
          tenantId: activeTenantId,
          permissions: ["employees:read", "employees:write"],
          memberships: seededMemberships,
        }),
      );
    },
    {
      accessToken: jwt(tenantA, "TENANT_ADMIN"),
      seededUser: profile,
      seededMemberships: memberships,
      activeTenantId: tenantA,
    },
  );
}

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

test("login gom role theo tenant, bắt chọn công ty và thay cả hai token khi switch", async ({ page }) => {
  const accessA = jwt(tenantA, "TENANT_ADMIN");
  const accessB = jwt(tenantB, "SITE_SUPERVISOR");
  let switchBody: unknown;
  let switchAuthorization = "";

  await page.route("**/api/v1/auth/login", (route) =>
    route.fulfill({
      json: api({
        accessToken: accessA,
        refreshToken: "refresh-a",
        tokenType: "Bearer",
        expiresIn: 900,
        activeTenantId: tenantA,
      }),
    }),
  );
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ json: api(profile) }),
  );
  await page.route("**/api/v1/roles/me", (route) =>
    route.fulfill({ json: api(memberships) }),
  );
  await page.route("**/api/v1/auth/switch-tenant", (route) => {
    switchBody = route.request().postDataJSON();
    switchAuthorization = route.request().headers().authorization ?? "";
    return route.fulfill({
      json: api({
        accessToken: accessB,
        refreshToken: "refresh-b",
        tokenType: "Bearer",
        expiresIn: 900,
        activeTenantId: tenantB,
      }),
    });
  });

  await page.goto("/login");
  await page.locator("#login-identifier").fill("multi-tenant@example.com");
  await page.locator("#login-password").fill("Password1");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

  await expect(page).toHaveURL(/\/customer\/select-company$/);
  await expect(page.getByRole("heading", { name: "Chọn công ty làm việc" })).toBeVisible();
  // Two role assignments in Alpha are rendered as one selectable company card.
  await expect(page.getByRole("button", { name: /Công ty Alpha/ })).toHaveCount(1);
  await expect(page.getByText("Quản trị công ty · Quản lý nhân sự")).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/01-select-company-grouped.png`, fullPage: true });

  await page.getByRole("button", { name: /Công ty Beta/ }).click();
  await expect.poll(() => switchBody).toEqual({ tenantId: tenantB, refreshToken: "refresh-a" });
  expect(switchAuthorization).toBe(`Bearer ${accessA}`);
  await expect(page).toHaveURL(/\/customer\/dashboard$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("fams_access_token"))).toBe(accessB);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("fams_refresh_token"))).toBe("refresh-b");
  await expect.poll(() =>
    page.evaluate(() => JSON.parse(localStorage.getItem("fams_user") ?? "null")?.tenantId),
  ).toBe(tenantB);
  await expect.poll(() =>
    page.evaluate(() => JSON.parse(localStorage.getItem("fams_user") ?? "null")?.permissions),
  ).toEqual(["sites:read"]);
});

test("menu gọi lại roles/me mỗi lần mở và loại tenant đã mất quyền sau lỗi 403", async ({ page }) => {
  await seedSession(page);
  let rolesCalls = 0;
  let membershipRevoked = false;

  await page.route("**/api/v1/roles/me", (route) => {
    rolesCalls += 1;
    return route.fulfill({ json: api(membershipRevoked ? memberships.slice(0, 2) : memberships) });
  });
  await page.route("**/api/v1/auth/switch-tenant", (route) => {
    membershipRevoked = true;
    return route.fulfill({
      status: 403,
      json: {
        success: false,
        message: "User has no active role in target tenant",
        userMessage: "Bạn không còn quyền tại công ty này.",
        errorCode: "ACCESS_DENIED",
        data: null,
      },
    });
  });

  await page.goto("/customer/dashboard");
  const switcher = page.getByRole("button", { name: "Chuyển đổi công ty" });
  await expect(switcher).toBeVisible();
  await switcher.click();
  await expect(page.getByText("Công ty Beta", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await switcher.click();
  await expect.poll(() => rolesCalls).toBeGreaterThanOrEqual(2);

  await page.getByText("Công ty Beta", { exact: true }).click();
  await expect(page.getByText(/vai trò của bạn.*không còn hiệu lực/i)).toBeVisible();
  await expect(switcher).toHaveCount(0);
  await page.screenshot({ path: `${evidenceDir}/02-revoked-membership-removed.png`, fullPage: true });
});

test("switch trả 401 thì xóa phiên và yêu cầu đăng nhập lại", async ({ page }) => {
  await seedSession(page);
  await page.route("**/api/v1/roles/me", (route) =>
    route.fulfill({ json: api(memberships) }),
  );
  await page.route("**/api/v1/auth/switch-tenant", (route) =>
    route.fulfill({
      status: 401,
      json: {
        success: false,
        message: "Invalid token pair",
        userMessage: "Phiên đăng nhập không hợp lệ.",
        errorCode: "UNAUTHORIZED",
        data: null,
      },
    }),
  );

  await page.goto("/customer/select-company");
  await page.getByRole("button", { name: /Công ty Beta/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("fams_access_token"))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("fams_refresh_token"))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("fams_user"))).toBeNull();
});
