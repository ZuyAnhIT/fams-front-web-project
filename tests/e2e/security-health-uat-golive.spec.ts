import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/security-health-uat-golive";
const tenantId = "11111111-1111-4111-8111-111111111111";
const employeeId = "22222222-2222-4222-8222-222222222222";
const goLiveId = "33333333-3333-4333-8333-333333333333";
const api = (data: unknown) => ({ success: true, message: "Success", data });
const pageData = (content: unknown[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: content.length ? 1 : 0, first: true, last: true });

async function seedUser(page: Page, role: string, permissions: string[], activeTenantId: string | null) {
  await page.addInitScript(({ seededRole, seededPermissions, seededTenant }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "security-health-e2e-access");
    localStorage.setItem("fams_refresh_token", "security-health-e2e-refresh");
    localStorage.setItem("fams_user", JSON.stringify({
      id: "security-health-user",
      email: "qa@example.com",
      displayName: "Security Health QA",
      emailVerified: true,
      active: true,
      role: seededRole,
      tenantId: seededTenant,
      permissions: seededPermissions,
      memberships: [],
      createdAt: now,
      updatedAt: now,
    }));
  }, { seededRole: role, seededPermissions: permissions, seededTenant: activeTenantId });
}

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    if (route.request().url().includes("/notifications")) {
      return route.fulfill({ json: api({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true, unreadCount: 0 }) });
    }
    return route.fulfill({ json: api(null) });
  });
});

test("Platform Admin xem đủ health/job và ký biên bản go-live bất biến", async ({ page }) => {
  await seedUser(page, "PLATFORM_ADMIN", [], null);
  const jobNames = ["AttendanceSummaryJob", "RandomCheckSchedulerJob", "RandomCheckDispatchJob", "NoResponseViolationJob", "RandomCheckQueueReconciliationJob", "DataRetentionJob", "SubscriptionExpirationJob"];
  const jobs = jobNames.map((jobName, index) => ({
    jobName,
    description: `Mô tả ${jobName}`,
    lastStatus: "OK",
    lastRunAt: `2026-08-06T0${index + 1}:00:00Z`,
    lastRunDurationMs: index + 2,
    errorMessage: null,
    expectedNextRunAt: `2026-08-07T0${index + 1}:00:00Z`,
    staleThresholdMinutes: 1560,
    stale: false,
  }));
  const steps = [
    "Platform Admin tạo tenant mới với ownerEmail hợp lệ và đúng gói dịch vụ",
    "Owner đăng nhập lần đầu và xác nhận đúng tenant/quyền",
    "Owner/Admin tạo site, geofence và ca làm việc",
    "HR mời nhân viên đầu tiên qua email",
    "Ứng viên chấp nhận lời mời và Employee được tạo đúng một lần",
    "HR phân công nhân viên vào đúng site và ca",
    "Nhân viên đồng ý và đăng ký Face ID bằng ảnh thật",
    "HR duyệt Face ID, trạng thái chuyển sang enrolled",
    "Nhân viên check-in trong geofence bằng mode yêu cầu Face ID",
    "Nhân viên check-out, work minutes được tính đúng",
    "HR đối chiếu báo cáo công ngày/tháng với check-in/out",
    "HR export Excel và mở file xác nhận dữ liệu/encoding",
    "HR lưu bộ lọc thường dùng và kiểm tra default filter",
    "Platform Admin trace audit theo tenant/request ID",
    "Kiểm tra masking JSON/Excel giống nhau và cross-tenant bị chặn 403/404",
  ].map((stepName) => ({ stepName, result: "PASS" }));
  const draftRecord = {
    id: goLiveId,
    tenantId,
    tenantName: "Beta Industries",
    environment: "production",
    buildVersion: "2026.08.07-1",
    status: "DRAFT",
    steps,
    performedBy: "security-health-user",
    performedByName: "Security Health QA",
    startedAt: "2026-08-07T01:00:00Z",
    completedAt: null,
    approvedBy: null,
    approvedByName: null,
    approvedAt: null,
    approvalNote: null,
    createdAt: "2026-08-07T01:00:00Z",
    updatedAt: "2026-08-07T01:00:00Z",
  };
  let createBody: Record<string, unknown> = {};
  let updateBody: Record<string, unknown> = {};
  await page.route("**/api/v1/platform/system-status", (route) => route.fulfill({ json: api({
    overallHealth: "UP",
    healthComponents: {
      db: { status: "UP", details: { database: "PostgreSQL" } },
      redis: { status: "UP", details: { version: "7.4.9" } },
      fcm: { status: "UP", details: { app_name: "[DEFAULT]" } },
      aiService: { status: "UP", details: { response: "{\"status\":\"ok\"}" } },
      randomCheckJob: { status: "UP", details: { RandomCheckDispatchJob_status: "OK" } },
      randomCheckQueue: { status: "UP", details: { dispatch_queue_size: 0, lag_seconds: 0 } },
      mail: { status: "UP", details: null },
    },
    jobs,
    activeTenantCount: 22,
    faceVerifyQueueDepth: 0,
    dispatchQueueDepth: 0,
    generatedAt: "2026-08-06T09:00:00Z",
  }) }));
  await page.route(new RegExp("/api/v1/tenants(?:\\?.*)?$"), (route) => route.fulfill({ json: api(pageData([{ id: tenantId, name: "Beta Industries", slug: "beta-industries" }])) }));
  await page.route(/\/api\/v1\/platform\/go-live-records(?:\/.*)?(?:\?.*)?$/, (route) => {
    const method = route.request().method();
    const url = route.request().url();
    if (method === "POST" && url.endsWith("/approve")) return route.fulfill({ json: api({ ...draftRecord, completedAt: "2026-08-07T02:00:00Z", status: "APPROVED", approvedBy: "security-health-user", approvedByName: "Security Health QA", approvedAt: "2026-08-07T02:05:00Z", approvalNote: "Đủ điều kiện vận hành", updatedAt: "2026-08-07T02:05:00Z" }) });
    if (method === "PATCH") {
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({ ...draftRecord, completedAt: "2026-08-07T02:00:00Z", updatedAt: "2026-08-07T02:00:00Z" }) });
    }
    if (method === "POST") {
      createBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 201, json: api(draftRecord) });
    }
    return route.fulfill({ json: api(pageData([])) });
  });

  await page.goto("/admin/system-status");
  await expect(page.getByText("Firebase / FCM")).toBeVisible();
  await expect(page.getByText("AI Service", { exact: true })).toBeVisible();
  await expect(page.getByText("Face ID, liveness và embedding")).toBeVisible();
  await expect(page.getByText("status", { exact: true })).toHaveCount(0);
  await expect(page.getByText("SubscriptionExpirationJob", { exact: true })).toBeVisible();
  await expect(page.getByText("7 ms")).toBeVisible();

  await page.getByRole("tab", { name: "Go-live & UAT" }).click();
  await expect(page.getByText("Hạ tầng và 7 job đều sẵn sàng")).toBeVisible();
  await expect(page.getByText("FCM / Notification provider")).toBeVisible();
  await page.getByRole("button", { name: "Tạo biên bản" }).click();
  await page.getByLabel("Tenant go-live").click();
  await page.getByText("Beta Industries (beta-industries)").click();
  await page.getByLabel("Build version").fill("2026.08.07-1");
  await page.getByRole("button", { name: "Tạo DRAFT" }).click();
  await expect.poll(() => createBody).toMatchObject({ tenantId, environment: "production", buildVersion: "2026.08.07-1", steps: [] });
  await expect(page.getByText("Beta Industries · 2026.08.07-1")).toBeVisible();
  await page.getByRole("button", { name: "Hoàn tất checklist" }).click();
  await expect.poll(() => updateBody).toMatchObject({ completed: true });
  expect(updateBody.steps).toHaveLength(15);
  await page.getByRole("button", { name: "Phê duyệt", exact: true }).click();
  await page.getByPlaceholder("Ghi chú phê duyệt/từ chối").fill("Đủ điều kiện vận hành");
  await page.getByRole("button", { name: "Phê duyệt và khóa" }).click();
  await expect(page.getByText("Biên bản chính thức đã khóa")).toBeVisible();
  await expect(page.getByText(/Security Health QA.*Đủ điều kiện vận hành/)).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/01-health-golive-uat.png`, fullPage: true });
});

test("System Health phân biệt NEVER_RUN, STALE, ERROR và OK", async ({ page }) => {
  await seedUser(page, "PLATFORM_ADMIN", [], null);
  const baseJob = {
    description: "Job giám sát",
    lastRunAt: "2026-08-06T01:00:00Z",
    lastRunDurationMs: 12,
    errorMessage: null,
    expectedNextRunAt: "2026-08-06T01:10:00Z",
    staleThresholdMinutes: 10,
  };
  await page.route("**/api/v1/platform/system-status", (route) => route.fulfill({ json: api({
    overallHealth: "DOWN",
    healthComponents: { db: { status: "UP", details: null } },
    jobs: [
      { ...baseJob, jobName: "AttendanceSummaryJob", lastStatus: "OK", stale: false },
      { ...baseJob, jobName: "RandomCheckSchedulerJob", lastStatus: "ERROR", stale: false, errorMessage: "Scheduler failed" },
      { ...baseJob, jobName: "RandomCheckDispatchJob", lastStatus: "NEVER_RUN", stale: false, lastRunAt: null, lastRunDurationMs: null },
      { ...baseJob, jobName: "NoResponseViolationJob", lastStatus: "OK", stale: true },
    ],
    activeTenantCount: 1,
    faceVerifyQueueDepth: 0,
    dispatchQueueDepth: 0,
    generatedAt: "2026-08-07T01:00:00Z",
  }) }));

  await page.goto("/admin/system-status");
  await expect(page.getByText("NEVER RUN")).toBeVisible();
  await expect(page.getByText("STALE", { exact: true })).toBeVisible();
  await expect(page.getByText("ERROR", { exact: true })).toBeVisible();
  await expect(page.getByText("OK", { exact: true })).toBeVisible();
});

test("HR thấy dữ liệu masked nhưng form không gửi chuỗi đã che ngược lên API", async ({ page }) => {
  await seedUser(page, "HR_MANAGER", ["employees:list", "employees:read", "employees:update"], tenantId);
  const employee = {
    id: employeeId,
    tenantId,
    userId: "employee-user",
    email: "a***@company.vn",
    phone: "***001",
    piiMasked: true,
    firstName: "An",
    lastName: "Nguyễn Văn",
    fullName: "Nguyễn Văn An",
    employeeCode: "NV001",
    position: "Kỹ sư",
    department: "Hiện trường",
    departmentId: null,
    hiredDate: "2026-01-01",
    avatarUrl: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-08-06T08:00:00Z",
    faceId: { status: "not_enrolled", consentGiven: false, reviewStatus: "none" },
    roles: [], workspaces: [], assignments: [],
  };
  let updateBody: Record<string, unknown> = {};

  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/employees(?:\\?.*)?$`), (route) => route.fulfill({ json: api(pageData([employee])) }));
  await page.route(`**/api/v1/tenants/${tenantId}/employees/${employeeId}`, (route) => {
    if (route.request().method() === "PATCH") {
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({ ...employee, ...updateBody }) });
    }
    return route.fulfill({ json: api(employee) });
  });
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/workspaces(?:\\?.*)?$`), (route) => route.fulfill({ json: api(pageData([])) }));

  await page.goto("/customer/employees");
  await expect(page.getByText("Thông tin liên hệ được bảo vệ theo quyền")).toBeVisible();
  await expect(page.getByText("a***@company.vn")).toBeVisible();
  await expect(page.getByText("Dữ liệu đã được che")).toBeAttached();
  await page.getByRole("button", { name: "Chi tiết" }).click();
  await expect(page.getByText("Dữ liệu liên hệ hiện tại đang được che")).toBeVisible();
  await expect(page.getByLabel("Email liên hệ")).toHaveValue("");
  await expect(page.getByLabel("Số điện thoại")).toHaveValue("");
  await expect(page.getByText("Giá trị hiện tại: a***@company.vn. Để trống nếu không thay đổi.")).toBeVisible();
  await page.getByLabel("Chức vụ").fill("Kỹ sư trưởng");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect.poll(() => updateBody).toMatchObject({ position: "Kỹ sư trưởng" });
  expect(updateBody).not.toHaveProperty("email");
  expect(updateBody).not.toHaveProperty("phone");
  await page.screenshot({ path: `${evidenceDir}/02-masked-employee-safe-update.png`, fullPage: true });
});

test("role không có employees permission bị chặn trước khi gọi API", async ({ page }) => {
  await seedUser(page, "HR_MANAGER", [], tenantId);
  let employeeApiCalls = 0;
  await page.route(`**/api/v1/tenants/${tenantId}/employees*`, (route) => {
    employeeApiCalls += 1;
    return route.fulfill({ status: 403, json: { success: false, message: "Forbidden", data: null } });
  });

  await page.goto("/customer/employees");
  await expect(page.getByText("403 Access Denied")).toBeVisible();
  expect(employeeApiCalls).toBe(0);
});

test("Help Center hiển thị hướng dẫn đúng vai trò Company Admin và Employee", async ({ page }) => {
  await seedUser(page, "HR_MANAGER", [], tenantId);
  await page.goto("/customer/help");
  await expect(page.getByRole("heading", { name: "Hướng dẫn sử dụng theo vai trò" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Company Admin / HR" })).toBeVisible();
  await page.getByText("Bảo vệ dữ liệu cá nhân").click();
  await expect(page.getByText(/Email\/SĐT có thể hiển thị dạng che/)).toBeVisible();
  await page.getByRole("tab", { name: "Hỗ trợ nhân viên" }).click();
  await expect(page.getByText("Đăng ký Face ID")).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/03-role-user-guide.png`, fullPage: true });
});
