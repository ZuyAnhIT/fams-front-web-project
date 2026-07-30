import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/checkin-management";
const tenantId = "11111111-1111-4111-8111-111111111111";
const siteId = "22222222-2222-4222-8222-222222222222";
const secondSiteId = "33333333-3333-4333-8333-333333333333";
const employeeId = "44444444-4444-4444-8444-444444444444";
const checkinId = "55555555-5555-4555-8555-555555555555";

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

const sites = [
  {
    id: siteId,
    tenantId,
    name: "Công trình Riverside",
    code: "RIVER-01",
    address: "Quận 1, TP.HCM",
    latitude: 10.7769,
    longitude: 106.7009,
    timezone: "Asia/Ho_Chi_Minh",
    checkinPolicy: "gps_face_liveness",
    status: "active",
    createdAt: "2026-07-29T01:00:00Z",
    updatedAt: "2026-07-29T01:00:00Z",
  },
  {
    id: secondSiteId,
    tenantId,
    name: "Kho phía Đông",
    code: "EAST-02",
    address: "TP. Thủ Đức",
    latitude: 10.85,
    longitude: 106.77,
    timezone: "Asia/Ho_Chi_Minh",
    checkinPolicy: "gps_only",
    status: "active",
    createdAt: "2026-07-29T01:00:00Z",
    updatedAt: "2026-07-29T01:00:00Z",
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

const checkin = {
  id: checkinId,
  tenantId,
  employeeId,
  siteId,
  shiftId: "66666666-6666-4666-8666-666666666666",
  assignmentId: "77777777-7777-4777-8777-777777777777",
  status: "pending_review",
  message: "Verification requires review",
  checkInAt: "2026-07-29T01:00:00Z",
  checkInLat: 10.7768,
  checkInLon: 106.7008,
  checkInAccuracy: 8,
  checkInInsideGeofence: true,
  checkOutAt: "2026-07-29T09:00:00Z",
  checkOutLat: 10.7767,
  checkOutLon: 106.7007,
  checkOutAccuracy: 10,
  checkOutInsideGeofence: true,
  workMinutes: 480,
  gpsRiskScore: 0.1,
  deviceId: "android-device-01",
  faceVerified: true,
  livenessVerified: false,
  faceVerifyScore: 0.91,
  checkoutFaceVerified: false,
  checkoutLivenessVerified: true,
  checkoutFaceVerifyScore: 0.42,
  effectiveCheckinPolicy: "gps_face_liveness",
  source: "offline",
  employeeName: "Nguyễn An",
  employeeCode: "NV001",
  siteName: "Công trình Riverside",
  createdAt: "2026-07-29T01:00:00Z",
  updatedAt: "2026-07-29T09:00:00Z",
};

const gpsOnlyCheckin = {
  ...checkin,
  id: "88888888-8888-4888-8888-888888888888",
  status: "valid",
  message: "Check-in recorded",
  checkOutAt: null,
  checkOutLat: null,
  checkOutLon: null,
  checkOutAccuracy: null,
  checkOutInsideGeofence: null,
  workMinutes: null,
  faceVerified: null,
  livenessVerified: null,
  faceVerifyScore: null,
  checkoutFaceVerified: null,
  checkoutLivenessVerified: null,
  checkoutFaceVerifyScore: null,
  effectiveCheckinPolicy: "gps_only",
  source: "online",
};

const detail = {
  id: checkinId,
  tenantId,
  status: "pending_review",
  message: "Verification requires review",
  gpsRiskScore: 0.1,
  deviceId: "android-device-01",
  checkInAt: checkin.checkInAt,
  checkInLat: checkin.checkInLat,
  checkInLon: checkin.checkInLon,
  checkInAccuracy: checkin.checkInAccuracy,
  checkInInsideGeofence: true,
  checkOutAt: checkin.checkOutAt,
  checkOutLat: checkin.checkOutLat,
  checkOutLon: checkin.checkOutLon,
  checkOutAccuracy: checkin.checkOutAccuracy,
  checkOutInsideGeofence: true,
  workMinutes: 480,
  faceVerified: true,
  livenessVerified: false,
  faceVerifyScore: 0.91,
  checkoutFaceVerified: false,
  checkoutLivenessVerified: true,
  checkoutFaceVerifyScore: 0.42,
  effectiveCheckinPolicy: "gps_face_liveness",
  source: "offline",
  clientNonce: "99999999-9999-4999-8999-999999999999",
  note: "Đã xác minh qua camera tại công trình.",
  overriddenBy: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  overriddenAt: "2026-07-29T10:00:00Z",
  employee: {
    id: employeeId,
    firstName: "An",
    lastName: "Nguyễn",
    employeeCode: "NV001",
    position: "Kỹ sư",
    department: "Thi công",
  },
  site: sites[0],
  shift: {
    id: checkin.shiftId,
    name: "Ca hành chính",
    startTime: "08:00:00",
    endTime: "17:00:00",
    allowOvernight: false,
    earlyCheckinMinutes: 15,
    lateCheckoutMinutes: 30,
  },
  createdAt: checkin.createdAt,
  updatedAt: checkin.updatedAt,
};

async function seedUser(
  page: Page,
  role: "HR_MANAGER" | "SITE_SUPERVISOR",
) {
  await page.addInitScript(
    ({ seededRole, seededTenant }) => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", "checkin-e2e-access");
      localStorage.setItem("fams_refresh_token", "checkin-e2e-refresh");
      localStorage.setItem(
        "fams_user",
        JSON.stringify({
          id: "checkin-e2e-user",
          email: "hr@example.com",
          displayName: "HR Manager",
          emailVerified: true,
          active: true,
          createdAt: now,
          updatedAt: now,
          role: seededRole,
          tenantId: seededTenant,
          permissions: ["checkins:list", "sites:list", "employees:list"],
          memberships: [],
        }),
      );
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

test("HR xem đủ bằng chứng hai đầu phiên, lọc và override có lý do", async ({
  page,
}) => {
  await seedUser(page, "HR_MANAGER");
  await mockDirectories(page);
  let listParams: Record<string, string> = {};
  let overrideBody: Record<string, unknown> = {};

  await page.route(`**/api/v1/tenants/${tenantId}/checkin?*`, (route) => {
    listParams = Object.fromEntries(new URL(route.request().url()).searchParams);
    return route.fulfill({ json: api(pageData([checkin, gpsOnlyCheckin])) });
  });
  await page.route(
    `**/api/v1/tenants/${tenantId}/checkin/${checkinId}/detail`,
    (route) => route.fulfill({ json: api(detail) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/checkin/${checkinId}/override`,
    (route) => {
      overrideBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        json: api({ ...checkin, status: overrideBody.status }),
      });
    },
  );

  await page.goto("/customer/attendance");
  await expect(page.getByText("Nguyễn An").first()).toBeVisible();
  await expect(page.getByText("Công trình Riverside").first()).toBeVisible();
  await expect(page.getByText("Liveness thất bại").first()).toBeVisible();
  await expect(page.getByText("Offline", { exact: true })).toBeVisible();
  await expect(page.getByText("Không áp dụng")).toBeVisible();
  await expect(page.getByText("Chưa check-out", { exact: true })).toBeVisible();

  await page.getByLabel("Lọc lượt chấm công theo trạng thái").click();
  await page
    .locator(".ant-select-dropdown:visible")
    .getByText("Cần xem xét", { exact: true })
    .click();
  await expect.poll(() => listParams).toMatchObject({
    status: "pending_review",
    sortBy: "checkInAt",
    sortDir: "desc",
    page: "0",
    size: "20",
  });

  await page
    .getByRole("row")
    .filter({ hasText: "Offline" })
    .getByRole("button", { name: "Chi tiết" })
    .click();
  const detailDialog = page.getByRole("dialog", { name: "Chi tiết chấm công" });
  await expect(detailDialog.getByText("Face ID khớp")).toBeVisible();
  await expect(
    detailDialog.getByText("Liveness thất bại", { exact: true }),
  ).toBeVisible();
  await expect(detailDialog.getByText("Face ID không khớp")).toBeVisible();
  await expect(detailDialog.getByText("480 phút")).toBeVisible();
  await expect(detailDialog.getByText("Bản ghi được đồng bộ offline")).toBeVisible();
  await expect(detailDialog.getByText("Dấu vết override gần nhất")).toBeVisible();
  await expect(
    detailDialog.getByText("Đã xác minh qua camera tại công trình."),
  ).toBeVisible();
  await detailDialog.getByRole("button", { name: "Override trạng thái" }).click();

  const overrideDialog = page.getByRole("dialog", {
    name: "Override trạng thái chấm công",
  });
  await overrideDialog
    .getByLabel("Lý do override trạng thái chấm công")
    .fill("Đã đối chiếu camera công trình và xác nhận nhân viên có mặt.");
  await overrideDialog.getByRole("button", { name: "Lưu quyết định" }).click();
  await expect.poll(() => overrideBody).toEqual({
    status: "valid",
    reason: "Đã đối chiếu camera công trình và xác nhận nhân viên có mặt.",
  });

  await page.screenshot({
    path: `${evidenceDir}/01-hr-review-and-override.png`,
    fullPage: true,
  });
});

test("Supervisor nhiều công trình phải chọn site trước khi tải dữ liệu", async ({
  page,
}) => {
  await seedUser(page, "SITE_SUPERVISOR");
  await mockDirectories(page);
  let checkinCalls = 0;
  let selectedSite = "";

  await page.route(`**/api/v1/tenants/${tenantId}/checkin?*`, (route) => {
    checkinCalls += 1;
    selectedSite = new URL(route.request().url()).searchParams.get("siteId") || "";
    return route.fulfill({ json: api(pageData([checkin])) });
  });

  await page.goto("/customer/attendance");
  await expect(page.getByText("Hãy chọn một công trình")).toBeVisible();
  await expect.poll(() => checkinCalls).toBe(0);

  await page.getByLabel("Lọc lượt chấm công theo công trình").click();
  await page
    .locator(".ant-select-dropdown:visible")
    .getByText("Công trình Riverside", { exact: true })
    .click();
  await expect.poll(() => selectedSite).toBe(siteId);
  await expect(page.getByText("Nguyễn An")).toBeVisible();

  await page.screenshot({
    path: `${evidenceDir}/02-supervisor-site-scope.png`,
    fullPage: true,
  });
});
