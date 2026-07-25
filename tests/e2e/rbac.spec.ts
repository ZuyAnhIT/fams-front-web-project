import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/rbac";
const tenantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const roleId = "33333333-3333-4333-8333-333333333333";
const systemRoleId = "44444444-4444-4444-8444-444444444444";
const permissionId = "55555555-5555-4555-8555-555555555555";
const siteId = "66666666-6666-4666-8666-666666666666";

const api = (data: unknown) => ({ success: true, message: "Success", data });
const pageData = (content: unknown[]) => ({
  content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true,
});

async function seedUser(page: Page, role: string, tenant: string | null, permissions: string[]) {
  await page.addInitScript(({ seededRole, seededTenant, seededPermissions }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "rbac-e2e-access");
    localStorage.setItem("fams_refresh_token", "rbac-e2e-refresh");
    localStorage.setItem("fams_user", JSON.stringify({
      id: "22222222-2222-4222-8222-222222222222",
      email: "admin@example.com",
      displayName: "RBAC Admin",
      emailVerified: true,
      active: true,
      createdAt: now,
      updatedAt: now,
      role: seededRole,
      tenantId: seededTenant,
      permissions: seededPermissions,
      memberships: [],
    }));
  }, { seededRole: role, seededTenant: tenant, seededPermissions: permissions });
}

const systemRole = {
  id: systemRoleId,
  name: "TENANT_ADMIN",
  description: "Quản trị công ty mặc định",
  isSystem: true,
  isActive: true,
  tenantId: null,
  permissionCount: 1,
  assignmentCount: 0,
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-20T00:00:00Z",
};

const customRole = {
  ...systemRole,
  id: roleId,
  name: "SITE_AUDITOR",
  description: "Kiểm tra công trình",
  isSystem: false,
  tenantId,
  assignmentCount: 2,
};

const permissionGroups = [{
  resource: "employees",
  permissionCount: 1,
  permissions: [{
    id: permissionId,
    name: "employees:read",
    resource: "employees",
    action: "read",
    description: "Xem nhân viên",
  }],
}];

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    if (route.request().url().includes("/notifications")) {
      return route.fulfill({ json: api({ items: [], unreadCount: 0 }) });
    }
    return route.fulfill({ json: api(null) });
  });
});

test("Company Admin xem role hệ thống chỉ đọc và tạo role tenant đúng contract", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN", tenantId, ["roles:read", "roles:create", "roles:update", "roles:delete"]);
  let createBody: Record<string, unknown> = {};
  let updateBody: Record<string, unknown> = {};

  await page.route("**/api/v1/roles?*", (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get("tenantId")).toBe(tenantId);
    return route.fulfill({ json: api(pageData([systemRole, customRole])) });
  });
  await page.route("**/api/v1/permissions", (route) => route.fulfill({ json: api(permissionGroups) }));
  await page.route(`**/api/v1/roles/${roleId}`, async (route) => {
    if (route.request().method() === "PUT") {
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({ ...customRole, ...updateBody, permissions: permissionGroups[0].permissions }) });
    }
    return route.fulfill({ json: api({ ...customRole, permissions: permissionGroups[0].permissions }) });
  });
  await page.route("**/api/v1/roles", async (route) => {
    createBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 201, json: api({ ...customRole, ...createBody, permissions: permissionGroups[0].permissions }) });
  });

  await page.goto("/customer/settings/roles");
  await expect(page.getByText("TENANT_ADMIN")).toBeVisible();
  await expect(page.getByText("SITE_AUDITOR")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sửa SITE_AUDITOR" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Xóa SITE_AUDITOR" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Xóa SITE_AUDITOR" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sửa TENANT_ADMIN" })).toHaveCount(0);

  await page.getByRole("button", { name: "Vô hiệu hóa SITE_AUDITOR" }).click();
  await expect.poll(() => updateBody).toEqual({
    name: "SITE_AUDITOR",
    description: "Kiểm tra công trình",
    permissionIds: [permissionId],
    isActive: false,
  });

  await page.getByRole("button", { name: "Tạo Role" }).click();
  await page.getByPlaceholder("Nhập tên role").fill("PAYROLL_VIEWER");
  await page.getByPlaceholder("Nhập mô tả cho role này").fill("Chỉ xem bảng lương");
  await page.getByText("Chọn tất cả").click();
  await page.getByRole("button", { name: "Tạo mới" }).click();

  await expect.poll(() => createBody).toMatchObject({
    tenantId,
    name: "PAYROLL_VIEWER",
    description: "Chỉ xem bảng lương",
    permissionIds: [permissionId],
  });
  await page.screenshot({ path: `${evidenceDir}/01-company-role-management.png`, fullPage: true });
});

test("Platform Admin tạo và gán role nền tảng không gửi tenantId", async ({ page }) => {
  await seedUser(page, "PLATFORM_ADMIN", null, []);
  let createBody: Record<string, unknown> = {};
  let assignBody: Record<string, unknown> = {};
  const platformRole = { ...customRole, tenantId: null, name: "SUPPORT_READER" };

  await page.route("**/api/v1/roles?*", (route) => route.fulfill({ json: api(pageData([systemRole, platformRole])) }));
  await page.route("**/api/v1/permissions", (route) => route.fulfill({ json: api(permissionGroups) }));
  await page.route("**/api/v1/users?*", (route) => route.fulfill({ json: api(pageData([{
    id: userId,
    email: "staff@fams.com",
    displayName: "FAMS Staff",
    active: true,
    platformAdmin: false,
    createdAt: systemRole.createdAt,
    updatedAt: systemRole.updatedAt,
  }])) }));
  await page.route("**/api/v1/roles", async (route) => {
    createBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 201, json: api({ ...platformRole, ...createBody, permissions: [] }) });
  });
  await page.route("**/api/v1/user-roles/platform", async (route) => {
    assignBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 201, json: api({ id: "assignment", ...assignBody, tenantId: null }) });
  });

  await page.goto("/admin/settings/roles");
  await page.getByRole("button", { name: "Tạo Role" }).click();
  await page.getByPlaceholder("Nhập tên role").fill("OPS_READER");
  await page.getByRole("button", { name: "Tạo mới" }).click();
  await expect.poll(() => createBody).toMatchObject({ name: "OPS_READER", permissionIds: [] });
  expect(createBody).not.toHaveProperty("tenantId");

  await page.getByRole("button", { name: "Gán role nền tảng" }).click();
  const userSelect = page.getByLabel("Tài khoản nhân sự FAMS");
  await userSelect.fill("staff");
  await page.getByText("FAMS Staff — staff@fams.com", { exact: true }).click();
  const platformRoleSelect = page.getByRole("dialog").getByRole("combobox").last();
  await platformRoleSelect.click();
  await platformRoleSelect.press("ArrowDown");
  await platformRoleSelect.press("Enter");
  await page.getByRole("button", { name: "Gán role", exact: true }).click();
  await expect.poll(() => assignBody).toEqual({ userId, roleId });
  await page.screenshot({ path: `${evidenceDir}/02-platform-role-management.png`, fullPage: true });
});

test("Gán role theo site, thu hồi role và hiển thị Quyền của tôi", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN", tenantId, ["roles:read", "roles:update"]);
  let assignBody: Record<string, unknown> = {};
  let revokedId = "";
  const employeeId = "77777777-7777-4777-8777-777777777777";
  const assignmentId = "88888888-8888-4888-8888-888888888888";

  await page.route(`**/api/v1/tenants/${tenantId}/employees/${employeeId}`, (route) => route.fulfill({ json: api({
    id: employeeId,
    userId,
    tenantId,
    firstName: "An",
    lastName: "Nguyễn",
    fullName: "Nguyễn An",
    status: "active",
    createdAt: systemRole.createdAt,
    updatedAt: systemRole.updatedAt,
    roles: [{ id: assignmentId, userId, roleId, tenantId, roleName: "SITE_AUDITOR", siteIds: [siteId], assignedAt: systemRole.createdAt }],
  }) }));
  await page.route("**/api/v1/roles?*", (route) => route.fulfill({ json: api(pageData([customRole])) }));
  await page.route(`**/api/v1/tenants/${tenantId}/sites?*`, (route) => route.fulfill({ json: api(pageData([{
    id: siteId, tenantId, name: "Công trình A", code: "SITE-A", timezone: "Asia/Ho_Chi_Minh",
    status: "active", createdAt: systemRole.createdAt, updatedAt: systemRole.updatedAt,
  }])) }));
  await page.route("**/api/v1/user-roles", async (route) => {
    assignBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 201, json: api({ id: "new-assignment", ...assignBody }) });
  });
  await page.route("**/api/v1/user-roles/*", async (route) => {
    revokedId = route.request().url().split("/").pop() || "";
    return route.fulfill({ json: api(null) });
  });
  await page.route("**/api/v1/roles/me", (route) => route.fulfill({ json: api([{
    id: assignmentId, userId, roleId, roleName: "SITE_AUDITOR", tenantId,
    tenantName: "Acme Việt Nam", permissions: ["employees:read"], siteIds: [siteId],
    sites: [{ id: siteId, name: "Công trình A" }],
  }]) }));

  await page.goto(`/customer/employees/${employeeId}`);
  await page.getByRole("tab", { name: /Vai trò & Phân quyền/ }).click();
  await expect(page.getByText("1 công trình")).toBeVisible();
  await page.getByRole("button", { name: "Gán Role" }).click();
  const tenantRoleSelect = page.getByRole("dialog").getByRole("combobox").first();
  await tenantRoleSelect.click();
  await tenantRoleSelect.press("ArrowDown");
  await tenantRoleSelect.press("Enter");
  await page.getByLabel("Công trình cụ thể").check();
  const siteSelect = page.getByRole("dialog").getByRole("combobox").last();
  await siteSelect.click();
  await siteSelect.press("ArrowDown");
  await siteSelect.press("Enter");
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect.poll(() => assignBody).toEqual({ userId, roleId, tenantId, siteIds: [siteId] });

  await page.getByRole("button", { name: "Thu hồi" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Thu hồi", exact: true }).click();
  await expect.poll(() => revokedId).toBe(assignmentId);

  await page.goto("/customer/settings/permissions");
  await expect(page.getByRole("heading", { name: "Quyền của tôi" })).toBeVisible();
  await expect(page.getByText("SITE_AUDITOR")).toBeVisible();
  await expect(page.getByText("employees:read")).toBeVisible();
  await expect(page.getByText("Công trình A").first()).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/03-assignment-and-my-permissions.png`, fullPage: true });
});

test("Platform Admin duyệt user directory với filter/sort và mở gán role theo người", async ({ page }) => {
  await seedUser(page, "PLATFORM_ADMIN", null, []);
  let capturedParams: Record<string, string> = {};
  const platformRole = { ...customRole, tenantId: null, name: "SUPPORT_READER", assignmentCount: 0 };

  await page.route("**/api/v1/users?*", (route) => {
    capturedParams = Object.fromEntries(new URL(route.request().url()).searchParams);
    return route.fulfill({ json: api(pageData([{
      id: userId,
      email: "platform@fams.com",
      displayName: "Platform Operator",
      active: true,
      platformAdmin: true,
      lastLoginAt: "2026-07-25T08:00:00Z",
      createdAt: systemRole.createdAt,
      updatedAt: systemRole.updatedAt,
    }])) });
  });
  await page.route("**/api/v1/roles?*", (route) => route.fulfill({ json: api(pageData([systemRole, platformRole])) }));

  await page.goto("/admin/users");
  await expect(page.getByText("Platform Operator")).toBeVisible();
  await expect.poll(() => capturedParams).toMatchObject({
    sortBy: "lastLoginAt",
    sortDir: "desc",
    page: "0",
    size: "20",
  });
  expect(capturedParams).not.toHaveProperty("isPlatformAdmin");
  await page.getByText("Chỉ tài khoản có cờ Platform Admin").click();
  await expect.poll(() => capturedParams).toMatchObject({ isPlatformAdmin: "true" });
  await page.getByRole("button", { name: "Gán vai trò" }).click();
  await expect(page.getByRole("dialog", { name: "Gán role cấp nền tảng" })).toBeVisible();
  await expect(page.getByText(/Platform Operator — platform@fams.com/)).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/04-platform-user-directory.png`, fullPage: true });
});

test("Supervisor site-scoped phải chọn site trước khi tải lịch random-check", async ({ page }) => {
  await seedUser(page, "SITE_SUPERVISOR", tenantId, ["randomchecks:list", "randomchecks:configure"]);
  let listCalls = 0;
  let listSiteId = "";

  await page.route("**/api/v1/roles/me", (route) => route.fulfill({ json: api([{
    id: "scope-assignment",
    userId,
    roleId,
    roleName: "SITE_SUPERVISOR",
    tenantId,
    permissions: ["randomchecks:list", "randomchecks:configure"],
    siteIds: [siteId],
    sites: [{ id: siteId, name: "Công trình A" }],
  }]) }));
  await page.route(`**/api/v1/tenants/${tenantId}/sites?*`, (route) => route.fulfill({ json: api(pageData([{
    id: siteId,
    tenantId,
    name: "Công trình A",
    status: "active",
    timezone: "Asia/Ho_Chi_Minh",
    createdAt: systemRole.createdAt,
    updatedAt: systemRole.updatedAt,
  }])) }));
  await page.route(`**/api/v1/tenants/${tenantId}/scheduled-checks?*`, (route) => {
    listCalls += 1;
    listSiteId = new URL(route.request().url()).searchParams.get("siteId") || "";
    return route.fulfill({ json: api(pageData([{
      id: "scheduled-check-1",
      tenantId,
      assignmentId: "assignment",
      employeeId: "employee",
      siteId,
      shiftId: "shift",
      configId: "config",
      checkDate: "2026-07-25",
      checkIndex: 1,
      scheduledAt: "2026-07-25T08:00:00Z",
      status: "pending",
      createdAt: systemRole.createdAt,
    }])) });
  });

  await page.goto("/customer/random-checks");
  await expect(page.getByText("Bạn được giới hạn theo công trình", { exact: true })).toBeVisible();
  expect(listCalls).toBe(0);
  const siteFilter = page.getByLabel("Lọc theo công trình");
  await siteFilter.click();
  await siteFilter.press("ArrowDown");
  await siteFilter.press("Enter");
  await expect(page.getByText("Chờ gửi")).toBeVisible();
  await expect.poll(() => listSiteId).toBe(siteId);
  await page.screenshot({ path: `${evidenceDir}/05-random-check-site-scope.png`, fullPage: true });
});
