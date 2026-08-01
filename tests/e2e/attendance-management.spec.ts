import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/attendance-management";
const tenantId = "11111111-1111-4111-8111-111111111111";
const siteId = "22222222-2222-4222-8222-222222222222";
const secondSiteId = "33333333-3333-4333-8333-333333333333";
const employeeId = "44444444-4444-4444-8444-444444444444";
const summaryId = "55555555-5555-4555-8555-555555555555";

const api = (data: unknown) => ({ success: true, message: "Success", data });
const pageData = (content: unknown[], size = 20) => ({
  content,
  page: 0,
  size,
  totalElements: content.length,
  totalPages: 1,
  first: true,
  last: true,
});

const sites = [
  {
    id: siteId,
    tenantId,
    name: "Công trình Riverside",
    timezone: "Asia/Ho_Chi_Minh",
    checkinPolicy: "gps_face_liveness",
    status: "active",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
  {
    id: secondSiteId,
    tenantId,
    name: "Kho phía Đông",
    timezone: "Asia/Ho_Chi_Minh",
    checkinPolicy: "gps_only",
    status: "active",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
];

const employee = {
  id: employeeId,
  tenantId,
  firstName: "An",
  lastName: "Nguyễn",
  fullName: "Nguyễn An",
  employeeCode: "NV001",
  status: "active",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
};

const pendingSummary = {
  id: summaryId,
  tenantId,
  employeeId,
  employeeName: "Nguyễn An",
  siteId,
  siteName: "Công trình Riverside",
  shiftId: "66666666-6666-4666-8666-666666666666",
  assignmentId: "77777777-7777-4777-8777-777777777777",
  attendanceDate: "2026-07-29",
  firstCheckinAt: "2026-07-29T01:05:00Z",
  lastCheckoutAt: "2026-07-29T09:35:00Z",
  totalWorkMinutes: 510,
  sessionCount: 1,
  status: "present",
  late: true,
  lateMinutes: 5,
  earlyLeave: false,
  earlyLeaveMinutes: 0,
  otMinutes: 30,
  missingCheckout: false,
  hasPendingReviewSession: true,
  hasRejectedSession: false,
  hasRandomCheckFailure: true,
  adjustmentReason: "Đã đối chiếu đơn công tác",
  createdAt: "2026-07-29T10:00:00Z",
  updatedAt: "2026-07-29T11:00:00Z",
};

const rejectedSummary = {
  ...pendingSummary,
  id: "88888888-8888-4888-8888-888888888888",
  attendanceDate: "2026-07-28",
  totalWorkMinutes: 0,
  sessionCount: 0,
  otMinutes: 0,
  hasPendingReviewSession: false,
  hasRejectedSession: true,
  hasRandomCheckFailure: false,
  adjustmentReason: null,
};

const monthlyRows = [
  {
    tenantId,
    employeeId,
    employeeName: "Nguyễn An",
    siteId,
    siteName: "Công trình Riverside",
    year: 2026,
    month: 7,
    presentDays: 22,
    totalWorkMinutes: 10560,
    lateDays: 2,
    totalLateMinutes: 35,
    earlyLeaveDays: 1,
    totalEarlyLeaveMinutes: 20,
    totalOtMinutes: 90,
    missingCheckoutDays: 1,
    daysWithPendingReview: 2,
    daysWithRejectedSession: 1,
    daysWithRandomCheckFailure: 2,
    exceedsRandomCheckFailureThreshold: false,
  },
  {
    tenantId,
    employeeId: "99999999-9999-4999-8999-999999999999",
    employeeName: "Trần Bình",
    siteId,
    siteName: "Công trình Riverside",
    year: 2026,
    month: 7,
    presentDays: 20,
    totalWorkMinutes: 9600,
    lateDays: 0,
    totalLateMinutes: 0,
    earlyLeaveDays: 0,
    totalEarlyLeaveMinutes: 0,
    totalOtMinutes: 0,
    missingCheckoutDays: 0,
    daysWithPendingReview: 0,
    daysWithRejectedSession: 0,
    daysWithRandomCheckFailure: 0,
    exceedsRandomCheckFailureThreshold: false,
  },
];

async function seedUser(page: Page, role: "HR_MANAGER" | "SITE_SUPERVISOR") {
  await page.addInitScript(
    ({ seededRole, seededTenant }) => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", "attendance-e2e-access");
      localStorage.setItem("fams_refresh_token", "attendance-e2e-refresh");
      localStorage.setItem("fams_user", JSON.stringify({
        id: "attendance-e2e-user",
        email: "hr@example.com",
        displayName: "HR Manager",
        emailVerified: true,
        active: true,
        createdAt: now,
        updatedAt: now,
        role: seededRole,
        tenantId: seededTenant,
        permissions: ["attendance:list", "attendance:read", "attendance:export", "sites:list", "employees:list"],
        memberships: [],
      }));
    },
    { seededRole: role, seededTenant: tenantId },
  );
}

async function mockDirectories(page: Page) {
  await page.route(`**/api/v1/tenants/${tenantId}/sites?*`, (route) =>
    route.fulfill({ json: api(pageData(sites)) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/employees?*`, (route) =>
    route.fulfill({ json: api(pageData([employee])) }),
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

test("HR thấy đúng trạng thái chưa chốt và điều chỉnh bảng công với lý do khóa", async ({ page }) => {
  await seedUser(page, "HR_MANAGER");
  await mockDirectories(page);
  let adjustBody: Record<string, unknown> = {};
  let unlockBody: Record<string, unknown> = {};
  let recomputeUrl = "";
  let currentSummary: Record<string, unknown> = { ...pendingSummary };

  await page.route(`**/api/v1/tenants/${tenantId}/attendance?*`, (route) =>
    route.fulfill({ json: api(pageData([pendingSummary, rejectedSummary])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/attendance/${summaryId}`, (route) =>
    route.fulfill({ json: api(currentSummary) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/attendance/${summaryId}/adjust`, (route) => {
    adjustBody = route.request().postDataJSON() as Record<string, unknown>;
    currentSummary = { ...currentSummary, ...adjustBody, adjustmentReason: String(adjustBody.reason) };
    return route.fulfill({ json: api(currentSummary) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/attendance/${summaryId}/unlock-and-recompute`, (route) => {
    unlockBody = route.request().postDataJSON() as Record<string, unknown>;
    currentSummary = { ...currentSummary, adjustmentReason: null, totalWorkMinutes: 525 };
    return route.fulfill({ json: api(currentSummary) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/attendance/recompute?*`, (route) => {
    recomputeUrl = route.request().url();
    return route.fulfill({ json: api("Recomputed") });
  });

  await page.goto("/customer/attendance");
  await expect(page.getByRole("tab", { name: "Lịch sử Check-in" })).toHaveCount(0);
  await expect(page.getByText("Chờ duyệt", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Đã từ chối", { exact: true })).toBeVisible();
  await expect(page.getByText("Điều chỉnh tay", { exact: true })).toBeVisible();
  await expect(page.getByText("Random check", { exact: true })).toBeVisible();
  await expect(page.getByText("gồm 30p OT")).toBeVisible();

  await page.getByRole("row").filter({ hasText: "29/07/2026" }).getByRole("button", { name: "Chi tiết" }).click();
  const dialog = page.getByRole("dialog", { name: "Chi tiết bảng công ngày" });
  await expect(dialog.getByText(/khóa tự động tính lại/i)).toBeVisible();
  await dialog.getByLabel("Tổng phút làm việc").fill("480");
  await dialog.getByLabel("Lý do điều chỉnh").fill("Đã đối chiếu camera và đơn công tác bản giấy.");
  await dialog.getByRole("button", { name: "Lưu điều chỉnh" }).click();

  await expect.poll(() => adjustBody).toMatchObject({
    totalWorkMinutes: 480,
    status: "present",
    late: true,
    lateMinutes: 5,
    earlyLeave: false,
    earlyLeaveMinutes: 0,
    otMinutes: 30,
    missingCheckout: false,
    reason: "Đã đối chiếu camera và đơn công tác bản giấy.",
  });
  await expect(dialog.getByText("Đã lưu và khóa bản ghi")).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/01-daily-review-adjustment.png`, fullPage: true });

  await dialog.getByRole("button", { name: "Mở khóa và tính lại" }).click();
  const unlockDialog = page.locator(".ant-modal").filter({
    hasText: "Số liệu điều chỉnh thủ công sẽ được thay thế",
  });
  await unlockDialog.locator("textarea").fill("Đã nhận check-out offline bổ sung.");
  await unlockDialog.getByRole("button", { name: "Mở khóa và tính lại" }).click();
  await expect.poll(() => unlockBody).toEqual({ reason: "Đã nhận check-out offline bổ sung." });
  await expect(dialog.getByText("Tính lại từ dữ liệu chấm công nguồn")).toBeVisible();

  await dialog.getByRole("button", { name: "Tính lại", exact: true }).click();
  const recomputeDialog = page.getByRole("dialog", { name: "Tính lại bảng công ngày?" });
  await expect(recomputeDialog.getByText(/toàn bộ bảng công.*Công trình Riverside/i)).toBeVisible();
  await recomputeDialog.getByRole("button", { name: "Tính lại", exact: true }).click();
  await expect.poll(() => recomputeUrl).toContain(`date=2026-07-29`);
  expect(new URL(recomputeUrl).searchParams.get("siteId")).toBe(siteId);
});

test("xuất bảng lương dùng readiness 409 của Backend và chỉ retry sau xác nhận", async ({ page }) => {
  await seedUser(page, "HR_MANAGER");
  await mockDirectories(page);
  let exportCalls = 0;
  const confirmationFlags: string[] = [];

  await page.route(`**/api/v1/tenants/${tenantId}/attendance?*`, (route) =>
    route.fulfill({ json: api(pageData([])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/attendance/monthly?*`, (route) => {
    return route.fulfill({ json: api(pageData(monthlyRows, Number(new URL(route.request().url()).searchParams.get("size") || 20))) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/reports/attendance/export?*`, (route) => {
    exportCalls += 1;
    const confirmation = new URL(route.request().url()).searchParams.get("confirmDespiteWarnings") || "";
    confirmationFlags.push(confirmation);
    if (confirmation !== "true") {
      return route.fulfill({
        status: 409,
        contentType: "application/json",
        json: {
          success: false,
          errorCode: "ATTENDANCE_NOT_READY",
          message: "Attendance contains unresolved sessions",
          userMessage: "Có 2 ngày chờ duyệt và 1 ngày có phiên bị từ chối.",
        },
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: "fake-xlsx",
    });
  });

  await page.goto("/customer/attendance");
  await page.getByRole("tab", { name: "Tổng hợp tháng" }).click();
  await expect(page.getByText("Chờ duyệt 2 ngày")).toBeVisible();
  await expect(page.getByText("Từ chối 1 ngày")).toBeVisible();
  await expect(page.getByText("Random check 2 ngày")).toBeVisible();
  await expect(page.getByText("gồm 1h 30p OT")).toBeVisible();
  await page.getByRole("button", { name: "Xuất toàn bộ tháng" }).click();

  const warning = page.getByRole("dialog", { name: "Bảng công chưa sẵn sàng để chốt lương" });
  await expect(warning.getByText(/2 ngày chờ duyệt.*1 ngày.*bị từ chối/i)).toBeVisible();
  expect(exportCalls).toBe(1);
  expect(confirmationFlags).toEqual(["false"]);
  await page.screenshot({ path: `${evidenceDir}/02-payroll-export-warning.png`, fullPage: true });
  await warning.getByRole("button", { name: "Tôi hiểu, vẫn xuất" }).click();
  await expect.poll(() => exportCalls).toBe(2);
  expect(confirmationFlags).toEqual(["false", "true"]);
});

test("Supervisor phải chọn site riêng cho bảng công ngày và tháng", async ({ page }) => {
  await seedUser(page, "SITE_SUPERVISOR");
  await mockDirectories(page);
  let dailyCalls = 0;
  let monthlyCalls = 0;

  await page.route(`**/api/v1/tenants/${tenantId}/attendance?*`, (route) => {
    dailyCalls += 1;
    expect([siteId, secondSiteId]).toContain(
      new URL(route.request().url()).searchParams.get("siteId"),
    );
    return route.fulfill({ json: api(pageData([pendingSummary])) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/attendance/monthly?*`, (route) => {
    monthlyCalls += 1;
    expect([siteId, secondSiteId]).toContain(
      new URL(route.request().url()).searchParams.get("siteId"),
    );
    return route.fulfill({ json: api(pageData(monthlyRows)) });
  });

  await page.goto("/customer/attendance");
  await expect(page.getByText("Hãy chọn một công trình")).toBeVisible();
  expect(dailyCalls).toBe(0);
  const dailySiteSelect = page.getByLabel("Lọc bảng công theo công trình");
  await dailySiteSelect.click();
  await dailySiteSelect.press("ArrowDown");
  await dailySiteSelect.press("Enter");
  await expect.poll(() => dailyCalls).toBe(1);

  await page.getByRole("tab", { name: "Tổng hợp tháng" }).click();
  await expect(page.getByText("Hãy chọn một công trình")).toBeVisible();
  expect(monthlyCalls).toBe(0);
  const monthlySiteSelect = page.getByLabel("Lọc bảng công tháng theo công trình");
  await monthlySiteSelect.click();
  await monthlySiteSelect.press("ArrowDown");
  await monthlySiteSelect.press("Enter");
  await expect.poll(() => monthlyCalls).toBe(1);
});
