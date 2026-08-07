import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/notification-jobs-retention";
const tenantId = "11111111-1111-4111-8111-111111111111";
const templateId = "22222222-2222-4222-8222-222222222222";
const api = (data: unknown) => ({ success: true, message: "Success", data });
const pageData = (content: unknown[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: content.length ? 1 : 0, first: true, last: true });

async function seedUser(page: Page, role: string, permissions: string[], activeTenantId: string | null) {
  await page.addInitScript(({ seededRole, seededPermissions, seededTenant }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "notification-ops-e2e-access");
    localStorage.setItem("fams_refresh_token", "notification-ops-e2e-refresh");
    localStorage.setItem("fams_user", JSON.stringify({
      id: "notification-ops-user",
      email: "ops@example.com",
      displayName: "Notification Ops",
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

test("Company Admin tạo, sửa và xóa template theo event type cùng locale", async ({ page }) => {
  await seedUser(page, "HR_MANAGER", ["notifications:manage"], tenantId);
  let templates: Array<Record<string, unknown>> = [];
  let createBody: Record<string, unknown> = {};
  let updateBody: Record<string, unknown> = {};
  let deletedId = "";

  await page.route("**/api/v1/notification-event-types", (route) => route.fulfill({ json: api([{
    eventType: "RANDOM_CHECK_SENT",
    label: "Kiểm tra ngẫu nhiên",
    description: "Yêu cầu phản hồi random check",
    defaultInAppEnabled: true,
    defaultPushEnabled: true,
  }]) }));
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/notification-templates(?:\\?.*)?$`), (route) => {
    if (route.request().method() === "POST") {
      createBody = route.request().postDataJSON() as Record<string, unknown>;
      const created = { id: templateId, tenantId, ...createBody, createdAt: "2026-08-06T08:00:00Z", updatedAt: "2026-08-06T08:00:00Z" };
      templates = [created];
      return route.fulfill({ status: 201, json: api(created) });
    }
    return route.fulfill({ json: api(pageData(templates)) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/notification-templates/${templateId}`, (route) => {
    if (route.request().method() === "PUT") {
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      templates = [{ ...templates[0], ...updateBody, updatedAt: "2026-08-06T08:10:00Z" }];
      return route.fulfill({ json: api(templates[0]) });
    }
    if (route.request().method() === "DELETE") {
      deletedId = templateId;
      templates = [];
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: api(templates[0]) });
  });

  await page.goto("/customer/settings/notification-templates");
  await expect(page.getByText("Chưa có template tùy chỉnh")).toBeVisible();
  await page.getByRole("button", { name: "Tạo template" }).click();
  const createDialog = page.getByRole("dialog", { name: "Tạo template thông báo" });
  await createDialog.getByLabel("Tiêu đề").fill("Kiểm tra tại {siteId}");
  await createDialog.getByLabel("Nội dung").fill("Phản hồi trước {expiresAt}");
  await expect(createDialog.getByText("Kiểm tra tại site-hanoi-01")).toBeVisible();
  await createDialog.getByRole("button", { name: "Tạo template" }).click();
  await expect.poll(() => createBody).toEqual({
    eventType: "RANDOM_CHECK_SENT",
    locale: "vi",
    titleTemplate: "Kiểm tra tại {siteId}",
    bodyTemplate: "Phản hồi trước {expiresAt}",
  });
  await expect(page.getByText("Kiểm tra tại {siteId}")).toBeVisible();

  await page.getByRole("button", { name: "Sửa" }).click();
  const editDialog = page.getByRole("dialog", { name: "Cập nhật template" });
  await editDialog.getByLabel("Tiêu đề").fill("Kiểm tra mới tại {siteId}");
  await editDialog.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect.poll(() => updateBody).toMatchObject({ titleTemplate: "Kiểm tra mới tại {siteId}" });
  await expect(page.getByText("Kiểm tra mới tại {siteId}")).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/01-notification-template-crud.png`, fullPage: true });

  await page.getByRole("button", { name: "Xóa" }).click();
  await page.getByRole("dialog", { name: "Xóa template thông báo?" }).getByRole("button", { name: "Xóa template" }).click();
  await expect.poll(() => deletedId).toBe(templateId);
  await expect(page.getByText("Chưa có template tùy chỉnh")).toBeVisible();
});

test("Platform Admin giám sát job và lọc delivery log thất bại", async ({ page }) => {
  await seedUser(page, "PLATFORM_ADMIN", [], null);
  let deliveryStatus: string | null = null;
  const generatedAt = "2026-08-06T09:00:00Z";

  await page.route("**/api/v1/platform/system-status", (route) => route.fulfill({ json: api({
    overallHealth: "UP",
    healthComponents: { db: { status: "UP", details: null }, redis: { status: "UP", details: null }, randomCheckQueue: { status: "UP", details: null } },
    jobs: ["AttendanceSummaryJob", "RandomCheckSchedulerJob", "RandomCheckDispatchJob", "NoResponseViolationJob", "RandomCheckQueueReconciliationJob", "DataRetentionJob", "SubscriptionExpirationJob"].map((jobName, index) => ({
      jobName,
      description: `Mô tả ${jobName}`,
      lastStatus: "OK",
      lastRunAt: `2026-08-06T0${index + 1}:00:00Z`,
      lastRunDurationMs: index + 1,
      errorMessage: null,
      expectedNextRunAt: `2026-08-07T0${index + 1}:00:00Z`,
      staleThresholdMinutes: 1560,
      stale: false,
    })),
    activeTenantCount: 15,
    faceVerifyQueueDepth: 2,
    dispatchQueueDepth: 4,
    generatedAt,
  }) }));
  await page.route("**/api/v1/platform/notifications/delivery-logs*", (route) => {
    deliveryStatus = new URL(route.request().url()).searchParams.get("status");
    return route.fulfill({ json: api(pageData([{
      id: "delivery-1",
      notificationId: null,
      deviceToken: "…a1b2c3",
      channel: "FCM",
      attemptNumber: 3,
      status: "FAILED",
      errorMessage: "Device token unregistered",
      createdAt: "2026-08-06T08:59:00Z",
    }])) });
  });

  await page.goto("/admin/system-status");
  await expect(page.getByText("Tính lại bảng công hằng đêm")).toBeVisible();
  await expect(page.getByText("Đối soát hàng đợi random check")).toBeVisible();
  await expect(page.getByText("Dọn dữ liệu quá hạn")).toBeVisible();
  await expect(page.getByText("15", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Delivery log" }).click();
  await page.getByRole("combobox").first().click();
  await page.locator(".ant-select-dropdown:visible").getByText("Thất bại", { exact: true }).click();
  await page.getByRole("button", { name: "Áp dụng" }).click();
  await expect.poll(() => deliveryStatus).toBe("FAILED");
  await expect(page.getByText("Device token unregistered")).toBeVisible();
  await expect(page.getByText("…a1b2c3")).toBeVisible();
  await expect(page.getByText("Push-only")).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/02-system-jobs-delivery-log.png`, fullPage: true });
});
