import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/workspace-management";
const tenantId = "11111111-1111-4111-8111-111111111111";
const operationsId = "22222222-2222-4222-8222-222222222222";
const inactiveId = "33333333-3333-4333-8333-333333333333";
const emptyId = "44444444-4444-4444-8444-444444444444";
const memberId = "55555555-5555-4555-8555-555555555555";
const employeeId = "66666666-6666-4666-8666-666666666666";

const api = (data: unknown) => ({ success: true, message: "Success", data });
const pageData = (content: unknown[]) => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
  first: true,
  last: true,
});

const operations = {
  id: operationsId,
  tenantId,
  name: "Khối Vận hành",
  description: "Điều phối hoạt động",
  type: "department",
  parentId: null,
  status: "active",
  activeMemberCount: 1,
  childWorkspaceCount: 0,
  createdBy: "admin",
  createdAt: "2026-07-26T01:00:00Z",
  updatedAt: "2026-07-26T01:00:00Z",
};

const inactive = {
  ...operations,
  id: inactiveId,
  name: "Nhóm cũ",
  type: "team",
  status: "inactive",
  activeMemberCount: 2,
};

const empty = {
  ...operations,
  id: emptyId,
  name: "Đội Dự phòng",
  type: "team",
  activeMemberCount: 0,
  childWorkspaceCount: 0,
};

const member = {
  id: memberId,
  workspaceId: operationsId,
  employeeId,
  tenantId,
  role: "lead",
  assignedBy: "admin",
  createdAt: "2026-07-26T01:00:00Z",
  updatedAt: "2026-07-26T01:00:00Z",
  employee: {
    id: employeeId,
    employeeCode: "NV006",
    firstName: "An",
    lastName: "Nguyễn",
    fullName: "Nguyễn An",
    email: "an@example.com",
    position: "Điều phối viên",
    status: "active",
  },
};

async function seedTenantAdmin(page: Page) {
  await page.addInitScript(({ seededTenant }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "workspace-e2e-access");
    localStorage.setItem("fams_refresh_token", "workspace-e2e-refresh");
    localStorage.setItem(
      "fams_user",
      JSON.stringify({
        id: "workspace-admin",
        email: "admin@example.com",
        displayName: "Workspace Admin",
        emailVerified: true,
        active: true,
        createdAt: now,
        updatedAt: now,
        role: "TENANT_ADMIN",
        tenantId: seededTenant,
        permissions: [
          "workspaces:list",
          "workspaces:read",
          "workspaces:create",
          "workspaces:update",
          "workspaces:delete",
          "workspace_members:list",
          "workspace_members:create",
          "workspace_members:delete",
          "employees:list",
          "employees:create",
        ],
        memberships: [],
      }),
    );
  }, { seededTenant: tenantId });
}

async function seedHrManager(page: Page) {
  await page.addInitScript(({ seededTenant }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "workspace-hr-e2e-access");
    localStorage.setItem("fams_refresh_token", "workspace-hr-e2e-refresh");
    localStorage.setItem(
      "fams_user",
      JSON.stringify({
        id: "workspace-hr",
        email: "hr@example.com",
        displayName: "HR Manager",
        emailVerified: true,
        active: true,
        createdAt: now,
        updatedAt: now,
        role: "HR_MANAGER",
        tenantId: seededTenant,
        permissions: [
          "workspaces:list",
          "workspaces:read",
          "workspaces:create",
          "workspaces:update",
          "workspace_members:list",
          "workspace_members:create",
          "workspace_members:delete",
        ],
        memberships: [],
      }),
    );
  }, { seededTenant: tenantId });
}

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    if (route.request().url().includes("/notifications")) {
      return route.fulfill({ json: api({ items: [], unreadCount: 0 }) });
    }
    return route.fulfill({ json: api(null) });
  });
});

test("danh sách và cây dùng filter/pagination, hiện counts và cảnh báo inactive", async ({ page }) => {
  await seedTenantAdmin(page);
  let listParams: Record<string, string> = {};

  await page.route(`**/api/v1/tenants/${tenantId}/workspaces/tree*`, (route) =>
    route.fulfill({
      json: api([
        { ...operations, children: [] },
        { ...inactive, children: [] },
        { ...empty, children: [] },
      ]),
    }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/workspaces?*`, (route) => {
    listParams = Object.fromEntries(new URL(route.request().url()).searchParams);
    return route.fulfill({ json: api(pageData([operations, inactive, empty])) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/workspaces/*/members?*`, (route) =>
    route.fulfill({ json: api(pageData([])) }),
  );

  await page.goto("/customer/workspaces");
  await expect(page.getByText("Khối Vận hành")).toBeVisible();
  await expect(page.getByText("1 người")).toBeVisible();

  await page.getByText("Danh sách", { exact: true }).click();
  await page.getByLabel("Lọc workspace theo trạng thái").click();
  await page.locator(".ant-select-dropdown:visible").getByText("Ngừng hoạt động", { exact: true }).click();
  await page.getByLabel("Lọc workspace theo loại").click();
  await page.locator(".ant-select-dropdown:visible").getByText("Đội nhóm", { exact: true }).click();
  await page.getByLabel("Tìm workspace").fill("Nhóm");

  await expect.poll(() => listParams).toMatchObject({
    search: "Nhóm",
    status: "inactive",
    type: "team",
    sortBy: "name",
    sortDir: "asc",
    page: "0",
    size: "20",
  });
  await expect(page.getByText(/Vẫn còn 2 nhân viên/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Xóa Nhóm cũ" })).toBeDisabled();
  await page.getByRole("button", { name: "Xóa Nhóm cũ" }).hover({ force: true });
  await expect(page.getByText(/Không thể xóa: còn 2 nhân viên/)).toBeVisible();
  await page.screenshot({
    path: `${evidenceDir}/01-list-filter-inactive.png`,
    fullPage: true,
  });
});

test("chuyển/gỡ nhân sự và xóa workspace dùng đúng endpoint, đúng quyền", async ({ page }) => {
  await seedTenantAdmin(page);
  let transferBody: Record<string, unknown> = {};
  let removedMemberId = "";
  let deletedWorkspaceId = "";

  await page.route(`**/api/v1/tenants/${tenantId}/workspaces/tree*`, (route) =>
    route.fulfill({
      json: api([
        { ...operations, children: [] },
        { ...inactive, children: [] },
        { ...empty, children: [] },
      ]),
    }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/workspaces?*`, (route) =>
    route.fulfill({ json: api(pageData([operations, inactive, empty])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/workspaces/${operationsId}/members?*`,
    (route) => route.fulfill({ json: api(pageData([member])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/workspaces/${operationsId}/members/${memberId}/transfer`,
    async (route) => {
      transferBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({ ...member, workspaceId: emptyId }) });
    },
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/workspaces/${operationsId}/members/${memberId}`,
    (route) => {
      removedMemberId = memberId;
      return route.fulfill({ status: 204, body: "" });
    },
  );
  await page.route(`**/api/v1/tenants/${tenantId}/workspaces/${emptyId}`, (route) => {
    deletedWorkspaceId = emptyId;
    return route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/customer/workspaces");
  await page.getByText("Khối Vận hành", { exact: true }).click();
  await expect(page.getByText("Nguyễn An")).toBeVisible();
  await expect(page.getByText("Trưởng nhóm")).toBeVisible();

  await page.getByRole("button", { name: "Chuyển Nguyễn An" }).click();
  await page.getByRole("dialog").getByLabel("Phòng ban đích").click();
  const targetDropdown = page.locator(".ant-select-dropdown:visible");
  await expect(targetDropdown.getByText("Nhóm cũ", { exact: true })).toHaveCount(0);
  await targetDropdown.getByText("Đội Dự phòng", { exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Chuyển ngay" }).click();
  await expect.poll(() => transferBody).toEqual({
    targetWorkspaceId: emptyId,
    role: "lead",
  });

  await page.getByRole("button", { name: "Gỡ Nguyễn An" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Gỡ nhân sự" }).click();
  await expect.poll(() => removedMemberId).toBe(memberId);

  await page.getByText("Danh sách", { exact: true }).click();
  await page.getByRole("button", { name: "Xóa Đội Dự phòng" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa workspace" }).click();
  await expect.poll(() => deletedWorkspaceId).toBe(emptyId);
  await page.screenshot({
    path: `${evidenceDir}/02-member-and-delete-actions.png`,
    fullPage: true,
  });
});

test("form nhân viên lấy phòng ban active từ Workspace và gửi departmentId", async ({ page }) => {
  await seedTenantAdmin(page);
  let createBody: Record<string, unknown> = {};
  let requestedActiveDepartments = false;

  await page.route(`**/api/v1/tenants/${tenantId}/employees?*`, (route) =>
    route.fulfill({ json: api(pageData([])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/employees`, (route) => {
    createBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({
      status: 201,
      json: api({ id: employeeId, tenantId, status: "active", ...createBody }),
    });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/workspaces?*`, (route) => {
    const params = new URL(route.request().url()).searchParams;
    if (params.get("type") === "department") {
      requestedActiveDepartments = params.get("status") === "active";
    }
    return route.fulfill({ json: api(pageData([operations])) });
  });

  await page.goto("/customer/employees");
  await page.getByRole("button", { name: "Thêm hồ sơ (chưa cần đăng nhập)" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Tên *", exact: true }).fill("Bình");
  await dialog.getByRole("textbox", { name: "Họ và tên đệm *", exact: true }).fill("Trần");
  await dialog.getByLabel("Phòng ban").click();
  await page.getByText("Khối Vận hành", { exact: true }).click();
  await dialog.getByRole("button", { name: "Tạo mới" }).click();

  await expect.poll(() => createBody).toMatchObject({
    firstName: "Bình",
    lastName: "Trần",
    departmentId: operationsId,
  });
  expect(requestedActiveDepartments).toBe(true);
  expect(createBody).not.toHaveProperty("department");
  await page.screenshot({
    path: `${evidenceDir}/03-employee-department-workspace.png`,
    fullPage: true,
  });
});

test("HR Manager được tạo/sửa, không được xóa và đưa workspace về root bằng clearParent", async ({ page }) => {
  await seedHrManager(page);
  let updateBody: Record<string, unknown> = {};
  const child = { ...empty, parentId: operationsId };

  await page.route(`**/api/v1/tenants/${tenantId}/workspaces/tree*`, (route) =>
    route.fulfill({
      json: api([
        { ...operations, childWorkspaceCount: 1, children: [{ ...child, children: [] }] },
      ]),
    }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/workspaces?*`, (route) =>
    route.fulfill({ json: api(pageData([operations, child])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/workspaces/${emptyId}`,
    (route) => {
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({ ...child, ...updateBody, parentId: null }) });
    },
  );
  await page.route(`**/api/v1/tenants/${tenantId}/workspaces/${emptyId}/members*`, (route) =>
    route.fulfill({ json: api(pageData([])) }),
  );

  await page.goto("/customer/workspaces");
  await expect(page.getByRole("button", { name: "Tạo workspace" })).toBeVisible();
  await page.getByText("Đội Dự phòng", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Xóa Đội Dự phòng" })).toHaveCount(0);
  await page.getByRole("button", { name: "Chỉnh sửa Đội Dự phòng" }).click();

  const dialog = page.getByRole("dialog");
  const parentSelect = dialog.getByLabel("Trực thuộc (Phòng ban cha)");
  await parentSelect.hover();
  await dialog.locator(".ant-select-clear").click();
  await dialog.getByRole("button", { name: "Lưu thay đổi" }).click();

  await expect.poll(() => updateBody).toMatchObject({
    name: "Đội Dự phòng",
    clearParent: true,
  });
  await page.screenshot({
    path: `${evidenceDir}/04-hr-permission-clear-parent.png`,
    fullPage: true,
  });
});
