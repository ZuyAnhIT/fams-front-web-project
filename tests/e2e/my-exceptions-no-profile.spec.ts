import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * #19 — "Cần giải thích" (/customer/exceptions) must NOT dead-end with a red
 * "Không thể tải hộp thư" error for a tenant_admin / HR account that has no employee
 * profile in the company. Backend now returns an empty 200; the page shows the normal
 * "Không có mục cần giải thích" empty state. Live backend.
 */

const liveEnabled = process.env.LIVE_BACKEND === "true";
const backendUrl = process.env.LIVE_BACKEND_URL || "http://localhost:8080";
const evidenceDir = "docs/test-evidence/my-exceptions-no-profile";

test.describe("#19 — my-exceptions inbox, no employee profile (live backend)", () => {
  test.skip(!liveEnabled, "Chỉ chạy khi LIVE_BACKEND=true");
  test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

  test("tenant admin without a profile sees the empty inbox, not a red error", async ({ page, request }) => {
    // duyanh19102005@gmail.com is TENANT_ADMIN of FOFO with NO employees row there.
    const login = (await (await request.post(`${backendUrl}/api/v1/auth/login`, {
      data: { identifier: "duyanh19102005@gmail.com", password: "Admin@1234" },
    })).json()).data;
    const tenantId = login.activeTenantId;

    await page.addInitScript(({ accessToken, refreshToken, userId, tid }) => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", accessToken);
      localStorage.setItem("fams_refresh_token", refreshToken);
      localStorage.setItem("fams_user", JSON.stringify({
        id: userId, email: "e2e@fams.vn", displayName: "QA", emailVerified: true, active: true,
        createdAt: now, updatedAt: now, role: "TENANT_ADMIN", tenantId: tid,
        permissions: ["violations:list"],
        memberships: [{ id: "m", userId, roleId: "ta", tenantId: tid, siteIds: [], roleName: "TENANT_ADMIN" }],
      }));
    }, { accessToken: login.accessToken, refreshToken: login.refreshToken, userId: login.userId, tid: tenantId });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/customer/exceptions");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${evidenceDir}/web-no-profile.png`, fullPage: true });

    await expect(page.getByText("Không có mục cần giải thích")).toBeVisible();
    await expect(page.getByText("Không thể tải hộp thư")).toHaveCount(0);
  });
});
