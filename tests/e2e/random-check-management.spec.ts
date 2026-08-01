import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/random-check-management";
const tenantId = "11111111-1111-4111-8111-111111111111";
const siteId = "22222222-2222-4222-8222-222222222222";
const employeeId = "33333333-3333-4333-8333-333333333333";
const configId = "44444444-4444-4444-8444-444444444444";
const checkId = "55555555-5555-4555-8555-555555555555";

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

const site = {
  id: siteId,
  tenantId,
  name: "Công trình Riverside",
  code: "RIVER",
  address: "Quận 7, TP.HCM",
  timezone: "Asia/Ho_Chi_Minh",
  latitude: 10.73,
  longitude: 106.72,
  checkinPolicy: "gps_face_liveness",
  status: "active",
  activeAssignmentCount: 1,
  shifts: [],
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-31T00:00:00Z",
};

const employee = {
  id: employeeId,
  tenantId,
  firstName: "An",
  lastName: "Nguyễn",
  employeeCode: "NV001",
  status: "active",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-31T00:00:00Z",
};

const defaultConfig = {
  id: configId,
  tenantId,
  siteId: null,
  checksPerShift: 2,
  minIntervalMinutes: 60,
  allowedStartTime: "08:00:00",
  allowedEndTime: "17:00:00",
  checkMode: "location_face_liveness",
  applicableRoles: ["worker"],
  responseWindowSeconds: 300,
  failureEscalationThreshold: 3,
  active: true,
  createdBy: "admin-user",
  createdAt: "2026-07-31T00:00:00Z",
  updatedAt: "2026-07-31T00:00:00Z",
};

async function seedUser(page: Page, permissions: string[]) {
  await page.addInitScript(({ seededTenant, seededPermissions }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "random-check-e2e-access");
    localStorage.setItem("fams_refresh_token", "random-check-e2e-refresh");
    localStorage.setItem("fams_user", JSON.stringify({
      id: "random-check-admin",
      email: "hr@example.com",
      displayName: "HR Manager",
      emailVerified: true,
      active: true,
      createdAt: now,
      updatedAt: now,
      role: "HR_MANAGER",
      tenantId: seededTenant,
      permissions: seededPermissions,
      memberships: [],
    }));
  }, { seededTenant: tenantId, seededPermissions: permissions });
}

async function mockCommonDirectories(page: Page) {
  await page.route("**/api/v1/roles/me", (route) => route.fulfill({
    json: api([{
      id: "role-assignment",
      tenantId,
      permissions: ["randomchecks:list", "randomchecks:configure"],
      siteIds: [],
      sites: [],
    }]),
  }));
  await page.route(`**/api/v1/tenants/${tenantId}/sites?*`, (route) =>
    route.fulfill({ json: api(pageData([site])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/employees?*`, (route) =>
    route.fulfill({ json: api(pageData([employee])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/scheduled-checks?*`, (route) =>
    route.fulfill({ json: api(pageData([])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/scheduled-checks/summary?*`, (route) =>
    route.fulfill({ json: api({ counts: { total: 0 } }) }),
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

test("Company Admin tạo policy mặc định với đầy đủ guard nghiệp vụ", async ({ page }) => {
  await seedUser(page, ["randomchecks:list", "randomchecks:configure", "sites:list", "employees:list"]);
  await mockCommonDirectories(page);
  let configs: unknown[] = [];
  let createBody: Record<string, unknown> = {};

  await page.route(`**/api/v1/tenants/${tenantId}/random-check-configs`, (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: api(configs) });
    return route.fallback();
  });
  await page.route(`**/api/v1/tenants/${tenantId}/random-check-configs/tenant-default`, (route) => {
    createBody = route.request().postDataJSON() as Record<string, unknown>;
    configs = [{ ...defaultConfig, ...createBody }];
    return route.fulfill({ status: 201, json: api(configs[0]) });
  });

  await page.goto("/customer/random-checks");
  await page.getByRole("tab", { name: "Cấu hình policy" }).click();
  await expect(page.getByText(/Hai tầng cấu hình/)).toBeVisible();
  await page.getByRole("button", { name: "Tạo cấu hình mặc định" }).click();
  const dialog = page.getByRole("dialog", { name: "Tạo cấu hình mặc định công ty" });
  await expect(dialog.getByText(/Giờ thực tế.*phần giao/i)).toBeVisible();
  await dialog.getByRole("button", { name: "Tạo cấu hình" }).click();

  await expect.poll(() => createBody).toMatchObject({
    checksPerShift: 2,
    minIntervalMinutes: 60,
    allowedStartTime: "08:00",
    allowedEndTime: "17:00",
    checkMode: "location_only",
    applicableRoles: [],
    responseWindowSeconds: 300,
    failureEscalationThreshold: 3,
  });
  await expect(page.getByText("Đang áp dụng")).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/01-tenant-default-config.png`, fullPage: true });
});

test("HR gửi kiểm tra thủ công có reason và xem bằng chứng GPS Face Liveness", async ({ page }) => {
  await seedUser(page, ["randomchecks:list", "randomchecks:configure", "sites:list", "employees:list", "assignments:list"]);
  await mockCommonDirectories(page);
  let manualBody: Record<string, unknown> = {};
  let photoRequests = 0;
  let photoAuthorization = "";
  const scheduledCheck = {
    id: checkId,
    tenantId,
    assignmentId: "assignment-1",
    employeeId,
    employeeName: "Nguyễn An",
    siteId,
    siteName: "Công trình Riverside",
    shiftId: "shift-1",
    configId,
    configSnapshot: JSON.stringify({
      checkMode: "location_face_liveness",
      checksPerShift: 2,
      minIntervalMinutes: 60,
      allowedStartTime: "08:00",
      allowedEndTime: "17:00",
      applicableRoles: ["worker", "supervisor"],
      responseWindowSeconds: 300,
    }),
    checkDate: "2026-07-31",
    checkIndex: 0,
    scheduledAt: "2026-07-31T08:00:00Z",
    expiresAt: "2026-07-31T08:05:00Z",
    status: "responded",
    outcome: "pass",
    failureReason: null,
    manualReason: "Nghi ngờ chấm công hộ",
    triggeredBy: "random-check-admin",
    createdAt: "2026-07-31T08:00:00Z",
  };

  await page.route(`**/api/v1/tenants/${tenantId}/sites/${siteId}/assignments?*`, (route) =>
    route.fulfill({ json: api(pageData([{
      id: "assignment-1",
      tenantId,
      siteId,
      employeeId,
      shiftId: "shift-1",
      employeeSummary: { id: employeeId, employeeCode: "NV001", fullName: "Nguyễn An", status: "active" },
      shiftSummary: { id: "shift-1", name: "Ca ngày", startTime: "08:00", endTime: "17:00", status: "active" },
      startDate: "2026-07-01",
      endDate: null,
      daysOfWeek: null,
      role: "worker",
      status: "active",
      createdBy: "admin",
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-07-01T00:00:00Z",
    }])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/random-check-configs/sites/${siteId}/effective`, (route) =>
    route.fulfill({ json: api({ ...defaultConfig, resolvedFrom: "tenant_default" }) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/scheduled-checks/manual`, (route) => {
    manualBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 201, json: api(scheduledCheck) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/scheduled-checks/${checkId}`, (route) =>
    route.fulfill({ json: api({
      ...scheduledCheck,
      response: {
        id: "response-1",
        scheduledCheckId: checkId,
        employeeId,
        respondedAt: "2026-07-31T08:01:00Z",
        latitude: 10.73,
        longitude: 106.72,
        accuracyMeters: 8,
        locationVerified: true,
        faceVerified: true,
        livenessVerified: true,
        faceVerifyScore: 0.87,
        hasPhotoEvidence: true,
        outcome: "pass",
        failureReason: null,
        createdAt: "2026-07-31T08:01:00Z",
      },
    }) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/scheduled-checks/${checkId}/photo`, (route) => {
    photoRequests += 1;
    photoAuthorization = route.request().headers().authorization || "";
    return route.fulfill({
      status: 200,
      contentType: "image/jpeg",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  });

  await page.goto("/customer/random-checks");
  await page.getByRole("button", { name: "Kiểm tra ngay" }).click();
  const dialog = page.getByRole("dialog", { name: "Gửi kiểm tra ngẫu nhiên ngay" });
  const siteSelect = dialog.getByLabel("Công trình");
  await siteSelect.click();
  await page.getByText("Công trình Riverside", { exact: true }).last().click();
  const employeeSelect = dialog.getByLabel("Nhân viên đang được phân công");
  await employeeSelect.click();
  await page.getByText("Nguyễn An (NV001)", { exact: true }).click();
  await dialog.getByLabel("Lý do kiểm tra").fill("Nghi ngờ chấm công hộ");
  await dialog.getByRole("button", { name: "Gửi kiểm tra ngay" }).click();

  await expect.poll(() => manualBody).toEqual({
    siteId,
    employeeId,
    reason: "Nghi ngờ chấm công hộ",
  });
  const detail = page.getByRole("dialog", { name: "Chi tiết lượt kiểm tra ngẫu nhiên" });
  await expect(detail.getByText("Kiểm tra thủ công có chủ đích")).toBeVisible();
  await expect(detail.getByText("10.73, 106.72")).toBeVisible();
  await expect(detail.getByText("Liveness", { exact: true })).toBeVisible();
  await expect(detail.getByText("87.0% (0.870)")).toBeVisible();
  await expect(detail.getByText("08:00 – 17:00")).toBeVisible();
  await expect(detail.getByText("300 giây")).toBeVisible();
  await expect(detail.getByText("2 lượt · tối thiểu 60 phút")).toBeVisible();
  await expect(detail.getByText("worker, supervisor")).toBeVisible();
  expect(photoRequests).toBe(0);
  await detail.getByRole("button", { name: "Xem ảnh bằng chứng" }).click();
  const photoDialog = page.getByRole("dialog", { name: "Ảnh selfie bằng chứng" });
  await expect(photoDialog.getByRole("img", { name: "Ảnh selfie Random Check của Nguyễn An" })).toBeVisible();
  expect(photoRequests).toBe(1);
  expect(photoAuthorization).toBe("Bearer random-check-e2e-access");
  await page.screenshot({ path: `${evidenceDir}/02-manual-check-evidence.png`, fullPage: true });
});

test("Danh sách dùng tên và kết quả Backend đã hydrate, detail tự đủ audit metadata", async ({ page }) => {
  await seedUser(page, ["randomchecks:list", "sites:list", "employees:list"]);
  await mockCommonDirectories(page);
  const hydratedCheck = {
    id: checkId,
    tenantId,
    assignmentId: "assignment-1",
    employeeId,
    employeeName: "Tên hydrate từ Backend",
    siteId,
    siteName: "Site hydrate từ Backend",
    shiftId: "shift-1",
    configId,
    configSnapshot: JSON.stringify({ checkMode: "location_face" }),
    checkDate: "2026-07-31",
    checkIndex: 1,
    scheduledAt: "2026-07-31T08:00:00Z",
    expiresAt: "2026-07-31T08:05:00Z",
    status: "responded",
    manualReason: null,
    triggeredBy: null,
    outcome: "fail",
    failureReason: "location_mismatch,face_fail",
    createdAt: "2026-07-31T08:00:00Z",
  };

  await page.route(`**/api/v1/tenants/${tenantId}/scheduled-checks?*`, (route) =>
    route.fulfill({ json: api(pageData([hydratedCheck])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/scheduled-checks/${checkId}`, (route) =>
    route.fulfill({ json: api({
      ...hydratedCheck,
      manualReason: "Kiểm tra đột xuất theo yêu cầu điều tra",
      triggeredBy: "auditor-user-id",
      response: {
        id: "response-2",
        scheduledCheckId: checkId,
        employeeId,
        respondedAt: "2026-07-31T08:01:00Z",
        latitude: 10.71,
        longitude: 106.70,
        accuracyMeters: 12,
        locationVerified: false,
        faceVerified: false,
        livenessVerified: null,
        faceVerifyScore: 0.31,
        hasPhotoEvidence: false,
        outcome: "fail",
        failureReason: "location_mismatch,face_fail",
        createdAt: "2026-07-31T08:01:00Z",
      },
    }) }),
  );

  await page.goto("/customer/random-checks");
  await expect(page.locator("thead").getByText("Giờ dự kiến")).toBeVisible();
  await expect(page.getByText("Lượt tự động #1")).toBeVisible();
  await expect(page.getByText("Tên hydrate từ Backend")).toBeVisible();
  await expect(page.getByText("Site hydrate từ Backend")).toBeVisible();
  await expect(page.getByText("Ngoài geofence, Face ID không đạt/chưa đăng ký")).toBeVisible();
  await page.getByRole("button", { name: "Chi tiết" }).click();

  const detail = page.getByRole("dialog", { name: "Chi tiết lượt kiểm tra ngẫu nhiên" });
  await expect(detail.getByText("Kiểm tra đột xuất theo yêu cầu điều tra", { exact: false })).toBeVisible();
  await expect(detail.getByText("31.0% (0.310)")).toBeVisible();
});

test("Site kế thừa tenant-default và tạo override hoàn chỉnh", async ({ page }) => {
  await seedUser(page, ["sites:read", "randomchecks:configure"]);
  let overrideBody: Record<string, unknown> = {};

  await page.route(`**/api/v1/tenants/${tenantId}/sites/${siteId}`, (route) =>
    route.fulfill({ json: api(site) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/random-check-configs/sites/${siteId}/effective`, (route) =>
    route.fulfill({ json: api({ ...defaultConfig, resolvedFrom: "tenant_default" }) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/random-check-configs/sites/${siteId}`, (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 404, json: { success: false, message: "No override", data: null } });
    }
    overrideBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 201, json: api({ ...defaultConfig, ...overrideBody, siteId, resolvedFrom: null }) });
  });

  await page.goto(`/customer/sites/${siteId}`);
  await page.getByRole("tab", { name: "Kiểm tra ngẫu nhiên" }).click();
  await expect(page.getByText("Đang kế thừa policy mặc định công ty")).toBeVisible();
  await page.getByRole("button", { name: "Tùy chỉnh riêng cho site" }).click();
  const dialog = page.getByRole("dialog", { name: "Tạo cấu hình riêng cho công trình" });
  await expect(dialog.getByText("Đã sao chép cấu hình đang áp dụng")).toBeVisible();
  await dialog.getByRole("button", { name: "Tạo cấu hình" }).click();

  await expect.poll(() => overrideBody).toMatchObject({
    checksPerShift: 2,
    minIntervalMinutes: 60,
    checkMode: "location_face_liveness",
    applicableRoles: ["worker"],
    failureEscalationThreshold: 3,
  });
  await page.screenshot({ path: `${evidenceDir}/03-site-effective-override.png`, fullPage: true });
});
