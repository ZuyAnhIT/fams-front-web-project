import { mkdirSync } from "node:fs";
import { test, type Page } from "@playwright/test";

/**
 * #06 — TOTP settings page shows the button matching the current 2FA state.
 * #07 — forgot/reset-password screens use the blue primary palette (not the grey
 *       `brand-*` scale) and a visible primary CTA on the success screen.
 */

const evidenceDir = "docs/test-evidence/totp-password-ui";
const api = (data: unknown) => ({ success: true, message: "Success", data });
const tenantId = "11111111-1111-4111-8111-111111111111";

mkdirSync(evidenceDir, { recursive: true });

async function seed(page: Page, totpEnabled: boolean) {
  await page.addInitScript(
    ({ enabled, tid }) => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", "totp-e2e");
      localStorage.setItem("fams_refresh_token", "totp-e2e-r");
      localStorage.setItem(
        "fams_user",
        JSON.stringify({
          id: "user-e2e", email: "e2e@fams.vn", displayName: "Lê Minh",
          emailVerified: true, active: true, createdAt: now, updatedAt: now,
          role: "HR_MANAGER", tenantId: tid, totpEnabled: enabled,
          permissions: ["employees:list"], memberships: [{ id: "m", userId: "user-e2e", roleId: "hr", tenantId: tid, siteIds: [] }],
        }),
      );
    },
    { enabled: totpEnabled, tid: tenantId },
  );
}

function routeApi(page: Page, totpEnabled: boolean) {
  return page.route("**/api/v1/**", (route) => {
    const url = route.request().url();
    if (url.includes("/notifications")) return route.fulfill({ json: api({ items: [], unreadCount: 0, totalElements: 0 }) });
    if (url.includes("/auth/me")) {
      return route.fulfill({
        json: api({ id: "user-e2e", email: "e2e@fams.vn", displayName: "Lê Minh", role: "HR_MANAGER", tenantId, totpEnabled }),
      });
    }
    return route.fulfill({ json: api(null) });
  });
}

for (const enabled of [false, true]) {
  test(`#06 - TOTP page when 2FA ${enabled ? "enabled" : "disabled"}`, async ({ page }) => {
    await seed(page, enabled);
    await routeApi(page, enabled);
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/customer/settings/totp");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${evidenceDir}/totp-${enabled ? "enabled" : "disabled"}.png` });
  });
}

test("#07 - reset password success screen", async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const url = route.request().url();
    if (url.includes("/auth/reset-password")) return route.fulfill({ json: api(null) });
    return route.fulfill({ json: api(null) });
  });
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto("/reset-password?token=demo-token-123");
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/Mật khẩu mới/i).fill("NewPass123!");
  await page.getByLabel(/Xác nhận mật khẩu/i).fill("NewPass123!");
  await page.screenshot({ path: `${evidenceDir}/reset-form.png` });
  await page.getByRole("button", { name: /Lưu mật khẩu mới/i }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${evidenceDir}/reset-success.png` });
});

test("#07 - forgot password screen", async ({ page }) => {
  await page.route("**/api/v1/**", (route) => route.fulfill({ json: api(null) }));
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto("/forgot-password");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${evidenceDir}/forgot-form.png` });
});
