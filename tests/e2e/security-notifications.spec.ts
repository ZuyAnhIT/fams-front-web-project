import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/security-notifications";
const tenantId = "11111111-1111-4111-8111-111111111111";
const checkId = "22222222-2222-4222-8222-222222222222";
const notificationIds = [
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
];
const api = (data: unknown) => ({ success: true, message: "Success", data });

async function seedUser(page: Page, permissions: string[] = []) {
  await page.addInitScript(({ seededTenant, seededPermissions }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "security-e2e-access");
    localStorage.setItem("fams_refresh_token", "security-e2e-refresh");
    localStorage.setItem("fams_user", JSON.stringify({
      id: "security-user",
      email: "security@example.com",
      displayName: "Security User",
      emailVerified: true,
      active: true,
      role: "HR_MANAGER",
      tenantId: seededTenant,
      permissions: seededPermissions,
      memberships: [],
      createdAt: now,
      updatedAt: now,
    }));
  }, { seededTenant: tenantId, seededPermissions: permissions });
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    if (route.request().url().includes("/notifications")) {
      return route.fulfill({ json: api({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true, unreadCount: 0 }) });
    }
    return route.fulfill({ json: api(null) });
  });
});

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

test("đăng nhập có 2FA chỉ tạo session sau khi TOTP hợp lệ", async ({ page }) => {
  const jwtPayload = Buffer.from(JSON.stringify({ tenantId, role: "HR_MANAGER", isPlatformAdmin: false }), "utf8").toString("base64url");
  const accessToken = `eyJhbGciOiJub25lIn0.${jwtPayload}.signature`;
  let totpBody: Record<string, unknown> = {};
  await page.route("**/api/v1/auth/login", (route) => route.fulfill({
    json: api({ accessToken: null, refreshToken: null, tokenType: "Bearer", expiresIn: 0, totpRequired: true, pendingToken: "pending-2fa-token" }),
  }));
  await page.route("**/api/v1/auth/login/totp", (route) => {
    totpBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: api({ accessToken, refreshToken: "refresh-after-2fa", tokenType: "Bearer", expiresIn: 900, totpRequired: false, pendingToken: null }) });
  });
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({
    json: api({ id: "security-user", email: "security@example.com", emailVerified: true, phone: null, phoneVerified: false, displayName: "Security User", avatarUrl: null, googleLinked: false, active: true, createdAt: "2026-08-06T08:00:00Z", updatedAt: "2026-08-06T08:00:00Z" }),
  }));
  await page.route("**/api/v1/roles/me", (route) => route.fulfill({
    json: api([{ id: "role-1", tenantId, tenantName: "FAMS Test", roleId: "role-id", roleName: "HR_MANAGER", permissions: [], siteIds: [], sites: [] }]),
  }));

  await page.goto("/login");
  await page.locator("#login-identifier").fill("security@example.com");
  await page.locator("#login-password").fill("Admin@1234");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Xác thực 2 Lớp" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("fams_access_token"))).toBeNull();

  const otpInputs = page.locator(".ant-otp input");
  for (const [index, digit] of [..."654321"].entries()) await otpInputs.nth(index).fill(digit);
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect.poll(() => totpBody).toMatchObject({ pendingToken: "pending-2fa-token", code: "654321" });
  await expect(page).toHaveURL(/\/customer\/dashboard$/);
});

test("bật TOTP hiển thị backup codes một lần và tắt bắt buộc xác thực lại", async ({ page }) => {
  await seedUser(page);
  let verifyBody: Record<string, unknown> = {};
  let disableBody: Record<string, unknown> = {};
  const setupExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await page.route("**/api/v1/auth/totp/setup", (route) => route.fulfill({
    json: api({
      setupToken: "55555555-5555-4555-8555-555555555555",
      otpauthUri: "otpauth://totp/FAMS:security%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=FAMS&algorithm=SHA1&digits=6&period=30",
      manualEntryKey: "JBSWY3DPEHPK3PXP",
      expiresAt: setupExpiresAt,
    }),
  }));
  await page.route("**/api/v1/auth/totp/verify", (route) => {
    verifyBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: api({ backupCodes: ["CODE0001", "CODE0002", "CODE0003", "CODE0004", "CODE0005", "CODE0006", "CODE0007", "CODE0008"] }) });
  });
  await page.route("**/api/v1/auth/totp/disable", (route) => {
    disableBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: api(null) });
  });

  await page.goto("/customer/settings/totp");
  await page.getByRole("button", { name: "Bật xác thực hai lớp" }).click();
  const qrCode = page.getByRole("img", { name: "Mã QR thiết lập TOTP" });
  await expect(qrCode).toBeVisible();
  await expect(qrCode).toHaveJSProperty("tagName", "svg");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByText("JBSWY3DPEHPK3PXP")).toBeVisible();
  const otpInputs = page.locator(".ant-otp input");
  for (const [index, digit] of [..."123456"].entries()) await otpInputs.nth(index).fill(digit);
  await page.getByRole("button", { name: "Xác nhận và bật" }).click();
  await expect.poll(() => verifyBody).toEqual({ setupToken: "55555555-5555-4555-8555-555555555555", code: "123456" });
  await expect(page.getByText("CODE0001")).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/01-totp-backup-codes.png`, fullPage: true });
  await expect(page.getByRole("button", { name: "Hoàn tất" })).toBeDisabled();
  await page.getByText("Tôi đã lưu mã dự phòng ở nơi an toàn").click();
  await page.getByRole("button", { name: "Hoàn tất" }).click();

  await page.getByRole("button", { name: "Tắt xác thực hai lớp" }).click();
  await page.getByLabel("Mật khẩu xác thực lại").fill("Admin@1234");
  await page.getByRole("button", { name: "Xác nhận tắt" }).click();
  await expect.poll(() => disableBody).toEqual({ password: "Admin@1234" });
});

test("hộp thư chọn nhiều, mark-read theo nhóm và deep-link bằng metadata", async ({ page }) => {
  await seedUser(page, ["randomchecks:list"]);
  let batchBody: Record<string, unknown> = {};
  let singleReadId = "";
  const items = notificationIds.map((id, index) => ({
    id,
    tenantId,
    userId: "security-user",
    eventType: index === 0 ? "RANDOM_CHECK_SENT" : "system.announcement",
    title: index === 0 ? "Kiểm tra ngẫu nhiên" : "Thông báo vận hành",
    body: "Nội dung thông báo",
    metadata: index === 0 ? { checkId, siteId: "site-1" } : null,
    isRead: false,
    readAt: null,
    createdAt: `2026-08-06T0${8 - index}:00:00Z`,
  }));

  await page.route(`**/api/v1/tenants/${tenantId}/notifications?*`, (route) => route.fulfill({
    json: api({ items, page: 0, size: 20, totalElements: 2, totalPages: 1, first: true, last: true, unreadCount: 2 }),
  }));
  await page.route(`**/api/v1/tenants/${tenantId}/notifications/read`, (route) => {
    batchBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: api({ markedCount: 2 }) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/notifications/*/read`, (route) => {
    singleReadId = route.request().url().split("/").at(-2) || "";
    return route.fulfill({ json: api({ ...items[0], isRead: true }) });
  });

  await page.goto("/customer/notifications");
  await page.getByText("Chọn tất cả chưa đọc trên trang").click();
  await page.screenshot({ path: `${evidenceDir}/02-notification-bulk-selection.png`, fullPage: true });
  await page.getByRole("button", { name: "Đánh dấu đã đọc (2)" }).click();
  await expect.poll(() => batchBody).toEqual({ notificationIds });

  await page.getByRole("button", { name: "Mở nội dung liên quan" }).click();
  await expect.poll(() => singleReadId).toBe(notificationIds[0]);
  await expect(page).toHaveURL(new RegExp(`/customer/random-checks\\?checkId=${checkId}$`));
});

test("cài đặt thông báo tách riêng in-app/push và mọi request có X-Request-Id", async ({ page }) => {
  await seedUser(page);
  let updateBody: Record<string, unknown> = {};
  let requestId = "";
  await page.route("**/api/v1/me/notification-settings", (route) => route.fulfill({
    json: api([
      {
        id: null,
        userId: "security-user",
        eventType: "RANDOM_CHECK_SENT",
        label: "Kiểm tra ngẫu nhiên",
        inAppEnabled: true,
        pushEnabled: true,
        customized: false,
        updatedAt: null,
      },
      {
        id: "custom-setting-1",
        userId: "security-user",
        eventType: "TENANT_CUSTOM_ALERT",
        label: null,
        inAppEnabled: false,
        pushEnabled: true,
        customized: true,
        updatedAt: "2026-08-06T08:00:00Z",
      },
    ]),
  }));
  await page.route("**/api/v1/me/notification-settings/RANDOM_CHECK_SENT", (route) => {
    updateBody = route.request().postDataJSON() as Record<string, unknown>;
    requestId = route.request().headers()["x-request-id"] || "";
    return route.fulfill({ json: api({ id: "setting-1", userId: "security-user", eventType: "RANDOM_CHECK_SENT", ...updateBody, updatedAt: "2026-08-06T08:01:00Z" }) });
  });

  await page.goto("/customer/settings/notifications");
  await expect(page.getByText("Kiểm tra ngẫu nhiên", { exact: true })).toBeVisible();
  await expect(page.getByText("TENANT_CUSTOM_ALERT", { exact: true })).toBeVisible();
  await expect(page.getByText("Đang dùng mặc định hệ thống")).toBeVisible();
  await expect(page.getByText("RANDOM_CHECK_DISPATCHED")).toHaveCount(0);
  await page.screenshot({ path: `${evidenceDir}/03-notification-channel-settings.png`, fullPage: true });
  await page.getByLabel("Thông báo trong hộp thư cho Kiểm tra ngẫu nhiên").click();
  await expect.poll(() => updateBody).toEqual({ inAppEnabled: false, pushEnabled: true });
  expect(requestId).toMatch(/^[0-9a-f-]{36}$/i);
});
