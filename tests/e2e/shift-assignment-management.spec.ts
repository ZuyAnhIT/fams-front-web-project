import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/shift-assignment-management";
const tenantId = "11111111-1111-4111-8111-111111111111";
const siteId = "22222222-2222-4222-8222-222222222222";
const activeShiftId = "33333333-3333-4333-8333-333333333333";
const inactiveShiftId = "44444444-4444-4444-8444-444444444444";
const assignmentId = "55555555-5555-4555-8555-555555555555";
const activeEmployeeId = "66666666-6666-4666-8666-666666666666";
const terminatedEmployeeId = "77777777-7777-4777-8777-777777777777";

const api = (data: unknown) => ({ success: true, message: "Success", data });
const pageData = (content: unknown[], totalElements = content.length) => ({
  content,
  page: 0,
  size: 10,
  totalElements,
  totalPages: Math.max(1, Math.ceil(totalElements / 10)),
  first: true,
  last: totalElements <= 10,
});

const site = {
  id: siteId,
  tenantId,
  name: "Công trình Riverside",
  code: "RIVER-01",
  address: "Quận 1, TP.HCM",
  latitude: 10.7769,
  longitude: 106.7009,
  timezone: "Asia/Ho_Chi_Minh",
  checkinPolicy: "gps_face",
  status: "active",
  createdBy: "admin-user",
  createdAt: "2026-07-27T01:00:00Z",
  updatedAt: "2026-07-27T01:00:00Z",
};

const activeShift = {
  id: activeShiftId,
  tenantId,
  siteId,
  name: "Ca hành chính",
  startTime: "08:00:00",
  endTime: "17:00:00",
  allowOvernight: false,
  allowOvertime: true,
  earlyCheckinMinutes: 15,
  lateCheckoutMinutes: 30,
  checkinPolicyOverride: null,
  status: "active",
  createdBy: "admin-user",
  createdAt: "2026-07-27T01:00:00Z",
  updatedAt: "2026-07-27T01:00:00Z",
  assignmentHistoryCount: 1,
  canDelete: false,
};

const inactiveShift = {
  ...activeShift,
  id: inactiveShiftId,
  name: "Ca cũ",
  status: "inactive",
  assignmentHistoryCount: 0,
  canDelete: true,
};

const assignment = {
  id: assignmentId,
  tenantId,
  siteId,
  employeeId: activeEmployeeId,
  shiftId: activeShiftId,
  employeeSummary: {
    id: activeEmployeeId,
    employeeCode: "NV001",
    fullName: "Nguyễn An",
    status: "active",
  },
  shiftSummary: {
    id: activeShiftId,
    name: "Ca hành chính",
    startTime: "08:00",
    endTime: "17:00",
    status: "active",
  },
  startDate: "2026-07-01",
  endDate: "2026-12-31",
  daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"],
  role: "worker",
  status: "active",
  notes: "Đội thi công A",
  createdBy: "admin-user",
  createdAt: "2026-07-27T01:00:00Z",
  updatedAt: "2026-07-27T01:00:00Z",
};

const employees = [
  {
    id: activeEmployeeId,
    tenantId,
    firstName: "An",
    lastName: "Nguyễn",
    fullName: "Nguyễn An",
    email: "an@example.com",
    employeeCode: "NV001",
    status: "active",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
  {
    id: terminatedEmployeeId,
    tenantId,
    firstName: "Bình",
    lastName: "Trần",
    fullName: "Trần Bình",
    email: "binh@example.com",
    employeeCode: "NV002",
    status: "terminated",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
];

const managementPermissions = [
  "sites:list",
  "sites:read",
  "geofences:read",
  "shifts:list",
  "shifts:read",
  "shifts:create",
  "shifts:update",
  "shifts:delete",
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
      localStorage.setItem("fams_access_token", "shift-assignment-e2e-access");
      localStorage.setItem("fams_refresh_token", "shift-assignment-e2e-refresh");
      localStorage.setItem(
        "fams_user",
        JSON.stringify({
          id: "shift-assignment-user",
          email: "hr@example.com",
          displayName: "HR Manager",
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

async function mockSiteDetail(
  page: Page,
  siteOverrides: Partial<typeof site> = {},
) {
  await page.route(`**/api/v1/tenants/${tenantId}/sites/${siteId}`, (route) =>
    route.fulfill({
      json: api({
        ...site,
        ...siteOverrides,
        geofence: null,
        shifts: [activeShift, inactiveShift],
        activeAssignmentCount: 1,
      }),
    }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/geofences?*`,
    (route) => route.fulfill({ json: api(pageData([])) }),
  );
  await page.route("**/api/v1/tenants/*/employees?*", (route) =>
    route.fulfill({ json: api(pageData(employees)) }),
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

test("Admin quản lý vòng đời ca, OT và không gửi sort ngoài contract", async ({
  page,
}) => {
  await seedUser(page, "TENANT_ADMIN", managementPermissions);
  await mockSiteDetail(page);
  let listParams: Record<string, string> = {};
  let createBody: Record<string, unknown> = {};
  let updateBody: Record<string, unknown> = {};
  let otBody: Record<string, unknown> = {};
  let deleteRequested = false;

  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments?*`,
    (route) => route.fulfill({ json: api(pageData([assignment])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts?*`,
    (route) => {
      listParams = Object.fromEntries(new URL(route.request().url()).searchParams);
      return route.fulfill({ json: api(pageData([activeShift, inactiveShift])) });
    },
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts`,
    (route) => {
      createBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 201, json: api({ ...activeShift, ...createBody }) });
    },
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts/${activeShiftId}/ot-config`,
    (route) => {
      otBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({ ...activeShift, ...otBody }) });
    },
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts/${activeShiftId}`,
    (route) => {
      if (route.request().method() === "DELETE") {
        deleteRequested = true;
        return route.fulfill({
          status: 400,
          json: {
            success: false,
            message:
              "Shift 'Ca hành chính' has been used by at least one assignment; use deactivate instead",
            data: null,
          },
        });
      }
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({ ...activeShift, ...updateBody }) });
    },
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts/${inactiveShiftId}`,
    (route) => {
      deleteRequested = route.request().method() === "DELETE";
      return route.fulfill({ json: api(null) });
    },
  );

  await page.goto(`/customer/sites/${siteId}`);
  await expect(page.getByText("Ca hành chính")).toBeVisible();
  await page.getByLabel("Lọc ca theo trạng thái").click();
  await page
    .locator(".ant-select-dropdown:visible")
    .getByText("Ngừng áp dụng", { exact: true })
    .click();
  await expect.poll(() => listParams.status).toBe("inactive");
  expect(listParams).not.toHaveProperty("sortBy");
  expect(listParams).not.toHaveProperty("sortDir");

  await page.getByRole("button", { name: "Tạo ca làm việc" }).click();
  const createDialog = page.getByRole("dialog");
  await createDialog.getByLabel("Tên ca làm việc").fill("Ca sáng");
  await createDialog.getByLabel("Giờ bắt đầu").fill("07:00");
  await createDialog.getByLabel("Giờ bắt đầu").press("Tab");
  await createDialog.getByLabel("Giờ kết thúc").fill("16:00");
  await createDialog.getByLabel("Giờ kết thúc").press("Tab");
  await page.keyboard.press("Escape");
  await createDialog
    .getByLabel("Kế thừa chính sách chấm công từ công trình")
    .click();
  await createDialog
    .getByLabel("Chính sách chấm công ghi đè của ca")
    .click();
  await page
    .locator(".ant-select-dropdown:visible")
    .getByText("GPS + Face ID + liveness", { exact: true })
    .click();
  await createDialog.getByRole("button", { name: "Tạo ca" }).click();
  await expect.poll(() => createBody).toMatchObject({
    name: "Ca sáng",
    startTime: "07:00",
    endTime: "16:00",
    allowOvernight: false,
    checkinPolicyOverride: "gps_face_liveness",
  });

  await page.getByRole("button", { name: "Cấu hình OT ca Ca hành chính" }).click();
  const otDialog = page.getByRole("dialog");
  await otDialog.getByLabel("Cho phép đến sớm").fill("20");
  await otDialog.getByLabel("Cho phép về muộn").fill("45");
  await otDialog.getByRole("button", { name: "Lưu cấu hình" }).click();
  await expect.poll(() => otBody).toMatchObject({
    earlyCheckinMinutes: 20,
    lateCheckoutMinutes: 45,
  });

  await page.getByRole("button", { name: "Ngừng dùng ca Ca hành chính" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Ngừng dùng" }).click();
  await expect.poll(() => updateBody).toEqual({ status: "inactive" });

  const blockedDeleteButton = page.getByRole("button", {
    name: "Xóa ca Ca hành chính",
  });
  await expect(blockedDeleteButton).toBeDisabled();
  await blockedDeleteButton.locator("xpath=..").hover();
  await expect(page.getByText(/ca này đã có 1 lượt phân công/)).toBeVisible();
  await page.getByRole("button", { name: "Xóa ca Ca cũ" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa ca" }).click();
  await expect.poll(() => deleteRequested).toBe(true);

  await page.screenshot({
    path: `${evidenceDir}/01-admin-shift-lifecycle.png`,
    fullPage: true,
  });
});

test("HR tạo phân công có lịch tuần, lọc terminated/inactive và hiển thị lỗi xung đột", async ({
  page,
}) => {
  await seedUser(page, "HR_MANAGER", managementPermissions);
  await mockSiteDetail(page);
  let createBody: Record<string, unknown> = {};

  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts?*`,
    (route) => route.fulfill({ json: api(pageData([activeShift, inactiveShift])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments?*`,
    (route) => route.fulfill({ json: api(pageData([assignment])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments`,
    (route) => {
      createBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        status: 409,
        json: {
          success: false,
          message:
            "Employee already has an overlapping active assignment at site 'Công trình Central'",
          data: null,
        },
      });
    },
  );

  await page.goto(`/customer/sites/${siteId}`);
  await page.getByRole("tab", { name: /Nhân sự phân công/ }).click();
  await expect(page.getByText("T2, T4, T6")).toBeVisible();
  await page.getByRole("button", { name: "Tạo phân công" }).click();
  const dialog = page.getByRole("dialog");

  await dialog.getByLabel("Nhân viên").click();
  const dropdown = page.locator(".ant-select-dropdown:visible");
  await expect(dropdown.getByText(/Nguyễn An/)).toBeVisible();
  await expect(dropdown.getByText(/Trần Bình/)).toHaveCount(0);
  await dropdown.getByText(/Nguyễn An/).click();

  await dialog.getByLabel("Ca làm việc").click();
  await expect(page.locator(".ant-select-dropdown:visible").getByText(/Ca cũ/)).toHaveCount(0);
  await page.locator(".ant-select-dropdown:visible").getByText(/Ca hành chính/).click();
  await dialog.getByLabel("Ngày bắt đầu").fill("01/08/2026");
  await dialog.getByText("T2", { exact: true }).click();
  await dialog.getByText("T4", { exact: true }).click();
  await dialog.getByRole("button", { name: "Tạo phân công" }).click();

  await expect.poll(() => createBody).toMatchObject({
    employeeId: activeEmployeeId,
    shiftId: activeShiftId,
    startDate: "2026-08-01",
    daysOfWeek: ["MONDAY", "WEDNESDAY"],
    role: "worker",
  });
  await expect(
    page.getByText(/Kiểm tra lịch phân công hiện tại của nhân viên/),
  ).toBeVisible();

  await page.screenshot({
    path: `${evidenceDir}/02-hr-assignment-conflict.png`,
    fullPage: true,
  });
});

test("HR cập nhật phân công dùng đúng clearShift/clearEndDate/clearDaysOfWeek", async ({
  page,
}) => {
  await seedUser(page, "HR_MANAGER", managementPermissions);
  await mockSiteDetail(page);
  let updateBody: Record<string, unknown> = {};

  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts?*`,
    (route) => route.fulfill({ json: api(pageData([activeShift, inactiveShift])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments?*`,
    (route) => route.fulfill({ json: api(pageData([assignment])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments/${assignmentId}`,
    (route) => {
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({ ...assignment, ...updateBody }) });
    },
  );

  await page.goto(`/customer/sites/${siteId}`);
  await page.getByRole("tab", { name: /Nhân sự phân công/ }).click();
  await page
    .getByRole("button", { name: "Sửa phân công của Nguyễn An" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator(".ant-select-clear").click();
  const endDateInput = dialog.getByLabel("Ngày kết thúc");
  const endDatePicker = endDateInput.locator("xpath=../..");
  await endDatePicker.hover();
  await endDatePicker.locator(".ant-picker-clear").click();
  for (const day of ["T2", "T4", "T6"]) {
    await dialog.getByText(day, { exact: true }).click();
  }
  await dialog.getByRole("button", { name: "Lưu thay đổi" }).click();

  await expect.poll(() => updateBody).toEqual({
    clearShift: true,
    clearEndDate: true,
    clearDaysOfWeek: true,
  });

  await page.screenshot({
    path: `${evidenceDir}/03-assignment-clear-fields.png`,
    fullPage: true,
  });
});

test("Site inactive khóa tạo/sửa nhưng vẫn cho hủy phân công hiện hữu", async ({
  page,
}) => {
  await seedUser(page, "HR_MANAGER", managementPermissions);
  await mockSiteDetail(page, { status: "inactive" });
  let cancelRequested = false;

  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts?*`,
    (route) => route.fulfill({ json: api(pageData([activeShift, inactiveShift])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments?*`,
    (route) => route.fulfill({ json: api(pageData([assignment])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments/${assignmentId}`,
    (route) => {
      cancelRequested = route.request().method() === "DELETE";
      return route.fulfill({ json: api(null) });
    },
  );

  await page.goto(`/customer/sites/${siteId}`);
  await page.getByRole("tab", { name: /Nhân sự phân công/ }).click();

  await expect(
    page.getByText("Công trình không nhận phân công mới"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tạo phân công" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Sửa phân công của Nguyễn An" }),
  ).toBeDisabled();

  await page
    .getByRole("button", { name: "Hủy phân công của Nguyễn An" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận hủy" })
    .click();
  await expect.poll(() => cancelRequested).toBe(true);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.screenshot({
    path: `${evidenceDir}/05-inactive-site-assignment-guard.png`,
    fullPage: true,
  });
});

test("Site Supervisor xem ca và phân công nhưng không có thao tác ghi", async ({
  page,
}) => {
  await seedUser(page, "SITE_SUPERVISOR", [
    "sites:list",
    "sites:read",
    "geofences:read",
    "shifts:list",
    "shifts:read",
    "assignments:list",
    "assignments:read",
  ]);
  await mockSiteDetail(page);
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts?*`,
    (route) => route.fulfill({ json: api(pageData([activeShift])) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments?*`,
    (route) => route.fulfill({ json: api(pageData([assignment])) }),
  );

  await page.goto(`/customer/sites/${siteId}`);
  await expect(page.getByText("Ca hành chính")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo ca làm việc" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Sửa ca/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Xóa ca/ })).toHaveCount(0);

  await page.getByRole("tab", { name: /Nhân sự phân công/ }).click();
  await expect(page.getByText("Nguyễn An")).toBeVisible();
  await page.getByLabel("Nhân viên", { exact: true }).click();
  await expect(
    page.locator(".ant-select-dropdown:visible").getByText(/Nguyễn An.*NV001/),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Tạo phân công" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Sửa phân công/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Hủy phân công/ })).toHaveCount(0);

  await page.screenshot({
    path: `${evidenceDir}/04-supervisor-read-only.png`,
    fullPage: true,
  });
});
