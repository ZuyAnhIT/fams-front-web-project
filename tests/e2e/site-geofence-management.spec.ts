import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/site-geofence-management";
const tenantId = "11111111-1111-4111-8111-111111111111";
const siteId = "22222222-2222-4222-8222-222222222222";
const emptySiteId = "33333333-3333-4333-8333-333333333333";
const forbiddenSiteId = "44444444-4444-4444-8444-444444444444";
const geofenceId = "55555555-5555-4555-8555-555555555555";
const shiftId = "66666666-6666-4666-8666-666666666666";
const assignmentId = "77777777-7777-4777-8777-777777777777";
const employeeId = "88888888-8888-4888-8888-888888888888";

const api = (data: unknown) => ({ success: true, message: "Success", data });
const pageData = (content: unknown[], totalElements = content.length) => ({
  content,
  page: 0,
  size: 20,
  totalElements,
  totalPages: Math.max(1, Math.ceil(totalElements / 20)),
  first: true,
  last: totalElements <= 20,
});

const site = {
  id: siteId,
  tenantId,
  name: "Công trình Riverside",
  code: "RIVER-01",
  description: "Dự án ven sông",
  address: "Quận 1, TP.HCM",
  latitude: 10.7769,
  longitude: 106.7009,
  timezone: "Asia/Ho_Chi_Minh",
  status: "active",
  createdBy: "admin-user",
  createdAt: "2026-07-27T01:00:00Z",
  updatedAt: "2026-07-27T01:00:00Z",
};

const emptySite = {
  ...site,
  id: emptySiteId,
  name: "Kho Dự phòng",
  code: "WAREHOUSE-02",
};

const geofence = {
  id: geofenceId,
  siteId,
  tenantId,
  coordinates: [
    [106.7, 10.776],
    [106.702, 10.776],
    [106.701, 10.778],
    [106.7, 10.776],
  ],
  bufferMeters: 25,
  status: "active",
  createdBy: "geofence-admin-user",
  createdAt: "2026-07-27T02:00:00Z",
  updatedAt: "2026-07-27T02:00:00Z",
};

const shift = {
  id: shiftId,
  siteId,
  tenantId,
  name: "Ca hành chính",
  startTime: "08:00",
  endTime: "17:00",
  allowOvernight: false,
  allowOvertime: true,
  earlyCheckinMinutes: 15,
  lateCheckoutMinutes: 30,
  status: "active",
  createdBy: "admin-user",
  createdAt: "2026-07-27T01:00:00Z",
  updatedAt: "2026-07-27T01:00:00Z",
};

const assignment = {
  id: assignmentId,
  tenantId,
  siteId,
  employeeId,
  shiftId,
  startDate: "2026-07-01",
  endDate: null,
  role: "worker",
  status: "active",
  createdBy: "admin-user",
  createdAt: "2026-07-27T01:00:00Z",
  updatedAt: "2026-07-27T01:00:00Z",
};

const managementPermissions = [
  "sites:list",
  "sites:read",
  "sites:create",
  "sites:update",
  "sites:delete",
  "geofences:read",
  "geofences:create",
  "geofences:update",
  "shifts:list",
  "shifts:read",
  "shifts:create",
  "shifts:update",
  "assignments:list",
  "assignments:read",
  "assignments:create",
  "assignments:update",
  "assignments:delete",
  "employees:list",
];

async function seedUser(
  page: Page,
  role: "TENANT_ADMIN" | "HR_MANAGER" | "SITE_SUPERVISOR",
  permissions: string[],
) {
  await page.addInitScript(
    ({ seededRole, seededPermissions, seededTenant }) => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", "site-e2e-access");
      localStorage.setItem("fams_refresh_token", "site-e2e-refresh");
      localStorage.setItem(
        "fams_user",
        JSON.stringify({
          id: "site-e2e-user",
          email: "site.manager@example.com",
          displayName: "Site Manager",
          emailVerified: true,
          active: true,
          createdAt: now,
          updatedAt: now,
          role: seededRole,
          tenantId: seededTenant,
          permissions: seededPermissions,
          memberships: [],
        }),
      );
    },
    {
      seededRole: role,
      seededPermissions: permissions,
      seededTenant: tenantId,
    },
  );
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

test("HR Manager tìm/lọc/sort/phân trang và tạo công trình đúng contract", async ({ page }) => {
  await seedUser(page, "HR_MANAGER", managementPermissions);
  let listParams: Record<string, string> = {};
  let createBody: Record<string, unknown> = {};

  await page.route(`**/api/v1/tenants/${tenantId}/sites?*`, (route) => {
    listParams = Object.fromEntries(new URL(route.request().url()).searchParams);
    return route.fulfill({ json: api(pageData([site], 25)) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/sites`, (route) => {
    createBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({
      status: 201,
      json: api({ ...emptySite, ...createBody }),
    });
  });

  await page.goto("/customer/sites");
  await expect(page.getByText("Công trình Riverside")).toBeVisible();
  await expect(page.getByRole("button", { name: "Thêm công trình" })).toBeVisible();

  await page.getByLabel("Lọc công trình theo trạng thái").click();
  await page
    .locator(".ant-select-dropdown:visible")
    .getByText("Hoạt động", { exact: true })
    .click();
  await page.getByLabel("Tìm công trình theo tên, mã hoặc địa chỉ").fill("Riverside");
  await expect.poll(() => listParams).toMatchObject({
    search: "Riverside",
    status: "active",
    sortBy: "name",
    sortDir: "asc",
    page: "0",
    size: "20",
  });
  expect(listParams).not.toHaveProperty("tenantId");

  await page.getByRole("listitem", { name: "2" }).click();
  await expect.poll(() => listParams.page).toBe("1");

  await page.getByRole("button", { name: "Thêm công trình" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tên công trình *").fill("Kho Dự phòng");
  await dialog.getByLabel("Mã công trình").fill("WAREHOUSE-02");
  await dialog.getByRole("button", { name: "Lưu công trình" }).click();
  await expect.poll(() => createBody).toMatchObject({
    name: "Kho Dự phòng",
    code: "WAREHOUSE-02",
    timezone: "Asia/Ho_Chi_Minh",
  });

  await page.screenshot({
    path: `${evidenceDir}/01-hr-site-list-create.png`,
    fullPage: true,
  });
});

test("Admin xem chi tiết liên kết và cập nhật riêng buffer tạo đúng phiên bản audit", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN", managementPermissions);
  let geofenceUpdateBody: Record<string, unknown> = {};

  await page.route(`**/api/v1/tenants/${tenantId}/sites/${siteId}`, (route) =>
    route.fulfill({
      json: api({
        ...site,
        geofence,
        shifts: [shift],
        activeAssignmentCount: 1,
      }),
    }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts?*`,
    (route) => route.fulfill({ json: api(pageData([shift])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments?*`,
    (route) => route.fulfill({ json: api(pageData([assignment])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/geofences?*`,
    (route) => route.fulfill({ json: api(pageData([geofence])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/geofences/active`,
    (route) => {
      geofenceUpdateBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        json: api({ ...geofence, bufferMeters: geofenceUpdateBody.bufferMeters }),
      });
    },
  );
  await page.route(`**/api/v1/tenants/${tenantId}/employees?*`, (route) =>
    route.fulfill({
      json: api(pageData([{
        id: employeeId,
        tenantId,
        firstName: "An",
        lastName: "Nguyễn",
        fullName: "Nguyễn An",
        employeeCode: "NV008",
        status: "active",
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-01T00:00:00Z",
      }])),
    }),
  );

  await page.goto(`/customer/sites/${siteId}`);
  await expect(page.getByText("Sai số GPS cho phép: 25 mét")).toBeVisible();
  await expect(page.getByText("Ca làm việc (1)")).toBeVisible();
  await expect(page.getByText("Nhân sự phân công (1)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Xóa công trình" })).toBeDisabled();
  await page.getByRole("button", { name: "Xóa công trình" }).hover({ force: true });
  await expect(page.getByText(/Không thể xóa: còn 1 nhân viên/)).toBeVisible();

  await page.getByRole("button", { name: "Cập nhật geofence" }).click();
  const geofenceDialog = page.getByRole("dialog");
  await geofenceDialog.getByLabel("Khoảng sai số GPS").fill("50");
  await geofenceDialog.getByRole("button", { name: "Lưu cấu hình" }).click();
  await expect.poll(() => geofenceUpdateBody).toEqual({ bufferMeters: 50 });

  await page.getByRole("tab", { name: "Lịch sử geofence" }).click();
  await expect(page.getByText("geofence-admin-user")).toBeVisible();
  await expect(
    page
      .getByLabel("Lịch sử thay đổi geofence")
      .getByText("Đang áp dụng"),
  ).toBeVisible();
  await page.screenshot({
    path: `${evidenceDir}/02-admin-detail-geofence-history.png`,
    fullPage: true,
  });
});

test("Site Supervisor chỉ xem site được giao và nhận thông báo 403 rõ ràng", async ({ page }) => {
  const readOnlyPermissions = [
    "sites:list",
    "sites:read",
    "geofences:read",
    "shifts:list",
    "shifts:read",
    "assignments:list",
    "assignments:read",
    "employees:list",
  ];
  await seedUser(page, "SITE_SUPERVISOR", readOnlyPermissions);

  await page.route(`**/api/v1/tenants/${tenantId}/sites?*`, (route) =>
    route.fulfill({ json: api(pageData([site])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/sites/${siteId}`, (route) =>
    route.fulfill({
      json: api({
        ...site,
        geofence,
        shifts: [shift],
        activeAssignmentCount: 1,
      }),
    }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts?*`,
    (route) => route.fulfill({ json: api(pageData([shift])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments?*`,
    (route) => route.fulfill({ json: api(pageData([assignment])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/geofences?*`,
    (route) => route.fulfill({ json: api(pageData([geofence])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/employees?*`, (route) =>
    route.fulfill({
      json: api(pageData([{
        id: employeeId,
        tenantId,
        firstName: "An",
        lastName: "Nguyễn",
        fullName: "Nguyễn An",
        employeeCode: "NV008",
        status: "active",
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-01T00:00:00Z",
      }])),
    }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${forbiddenSiteId}`,
    (route) =>
      route.fulfill({
        status: 403,
        json: {
          success: false,
          message: "You do not have permission to access this site",
          data: null,
        },
      }),
  );

  await page.goto("/customer/sites");
  await expect(page.getByRole("button", { name: "Thêm công trình" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sửa Công trình Riverside" })).toHaveCount(0);
  await page.getByRole("button", { name: "Xem chi tiết Công trình Riverside" }).click();
  await expect(page.getByRole("button", { name: "Sửa công trình" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Xóa công trình" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cập nhật geofence" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tạo ca làm việc" })).toHaveCount(0);

  await page.getByRole("tab", { name: /Nhân sự phân công/ }).click();
  await expect(page.getByRole("button", { name: "Tạo phân công" })).toHaveCount(0);
  await page.screenshot({
    path: `${evidenceDir}/03-supervisor-read-only.png`,
    fullPage: true,
  });

  await page.goto(`/customer/sites/${forbiddenSiteId}`);
  await expect(page.getByText("Bạn không có quyền xem công trình này")).toBeVisible();
  await expect(page.getByText(/nằm ngoài phạm vi site được giao/)).toBeVisible();
  await page.screenshot({
    path: `${evidenceDir}/04-supervisor-site-scope-403.png`,
    fullPage: true,
  });
});

test("Admin xóa site rỗng qua DELETE sau bước xác nhận", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN", managementPermissions);
  let deletedSiteId = "";

  await page.route(`**/api/v1/tenants/${tenantId}/sites/${emptySiteId}`, (route) => {
    if (route.request().method() === "DELETE") {
      deletedSiteId = emptySiteId;
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fulfill({
      json: api({
        ...emptySite,
        geofence: null,
        shifts: [],
        activeAssignmentCount: 0,
      }),
    });
  });
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${emptySiteId}/shifts?*`,
    (route) => route.fulfill({ json: api(pageData([])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${emptySiteId}/assignments?*`,
    (route) => route.fulfill({ json: api(pageData([])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${emptySiteId}/geofences?*`,
    (route) => route.fulfill({ json: api(pageData([])) }),
  );

  await page.goto(`/customer/sites/${emptySiteId}`);
  await page.getByRole("button", { name: "Xóa công trình" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa công trình" }).click();
  await expect.poll(() => deletedSiteId).toBe(emptySiteId);
});
