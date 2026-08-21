import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const tenantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const api = (data: unknown) => ({ success: true, message: "Success", data });

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.(ts|tsx)$/.test(entry.name)
        ? [path]
        : [];
  });
}

async function seedUser(
  page: Page,
  role: string,
  tenant: string | null,
  permissions: string[],
  memberships: Array<Record<string, unknown>> = [],
) {
  await page.addInitScript(({ seededRole, seededTenant, seededPermissions, seededMemberships }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "ui-ux-access");
    localStorage.setItem("fams_refresh_token", "ui-ux-refresh");
    localStorage.setItem("fams_user", JSON.stringify({
      id: "22222222-2222-4222-8222-222222222222",
      email: "ui-ux@example.com",
      displayName: "Kiểm thử UI",
      emailVerified: true,
      active: true,
      createdAt: now,
      updatedAt: now,
      role: seededRole,
      tenantId: seededTenant,
      permissions: seededPermissions,
      memberships: seededMemberships,
    }));
  }, {
    seededRole: role,
    seededTenant: tenant,
    seededPermissions: permissions,
    seededMemberships: memberships,
  });
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    if (route.request().url().includes("/notifications")) {
      return route.fulfill({ json: api({ items: [], unreadCount: 0, totalElements: 0 }) });
    }
    return route.fulfill({ json: api(null) });
  });
});

test("mọi lời gọi message/modal trực tiếp đều lấy instance từ Ant Design App context", () => {
  const sourceRoot = join(process.cwd(), "src");
  const staticCall = /\b(?:message|notification|Modal)\.(?:success|error|warning|info|open|confirm|destroy)\b/;
  const offenders = sourceFiles(sourceRoot)
    .filter((file) => staticCall.test(readFileSync(file, "utf8")))
    .filter((file) => !readFileSync(file, "utf8").includes("App.useApp()"))
    .map((file) => relative(process.cwd(), file));

  expect(offenders).toEqual([]);
  expect(readFileSync(join(sourceRoot, "services/api-client.ts"), "utf8"))
    .not.toMatch(/from ["']antd["']/);
});

test("URL phân trang sai được chuẩn hóa trước khi gọi API", async ({ page }) => {
  await seedUser(page, "PLATFORM_ADMIN", null, []);
  let capturedParams: Record<string, string> = {};

  await page.route("**/api/v1/tenants?*", (route) => {
    capturedParams = Object.fromEntries(new URL(route.request().url()).searchParams);
    return route.fulfill({ json: api({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    }) });
  });

  await page.goto("/admin/tenants?page=-3&size=999&sortDir=sideways");
  await expect.poll(() => capturedParams).toMatchObject({
    page: "0",
    size: "20",
    sortDir: "desc",
  });
  await expect(page.getByText("Không tìm thấy công ty")).toBeVisible();
  await expect(page.getByRole("link", { name: "Nhân viên", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Công trình", exact: true })).toHaveCount(0);
});

test("custom role thấy menu và dashboard đúng permission, không gọi nhầm dashboard nhân viên", async ({ page }) => {
  await seedUser(page, "SITE_AUDITOR", tenantId, ["sites:list"]);
  let employeeDashboardCalls = 0;
  await page.route(`**/api/v1/tenants/${tenantId}/dashboard/employee`, (route) => {
    employeeDashboardCalls += 1;
    return route.fulfill({ json: api(null) });
  });

  await page.goto("/customer/dashboard");
  await expect(page.getByRole("link", { name: "Tổng quan" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Hướng dẫn sử dụng" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Công trình", exact: true })).toBeVisible();
  await expect(page.getByText("Mở danh sách công trình trong phạm vi vai trò.")).toBeVisible();
  await expect(page.getByText("SITE_AUDITOR").first()).toBeVisible();
  expect(employeeDashboardCalls).toBe(0);

  await page.goto("/customer/help");
  await expect(page.getByRole("heading", { name: "Hướng dẫn sử dụng theo vai trò" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Theo quyền được cấp" })).toBeVisible();
  await expect(page.getByText("Công trình theo phạm vi", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Company Admin / HR" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Quản lý nhân viên/ })).toHaveCount(0);
});

test("owner nhiều role vẫn thấy cấu hình và thành viên dù role chính là custom", async ({ page }) => {
  await seedUser(page, "SITE_AUDITOR", tenantId, [], [{
    id: "membership-admin",
    userId,
    roleId: "tenant-admin-role",
    roleName: "TENANT_ADMIN",
    tenantId,
    permissions: [],
    siteIds: [],
  }]);
  await page.route(`**/api/v1/tenants/${tenantId}/detail`, (route) => route.fulfill({
    json: api({ id: tenantId, ownerId: userId, name: "Acme Việt Nam", status: "active" }),
  }));

  await page.goto("/customer/dashboard");
  await expect(page.getByRole("link", { name: "Cấu hình Công ty" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Thành viên công ty" })).toBeVisible();
});
