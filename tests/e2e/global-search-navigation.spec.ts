import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * Global search regression: results navigate, and the same persistent header input remains
 * usable after navigation. Also verifies a Vietnamese full name, not an internal UUID, is a
 * supported search key.
 */

const liveEnabled = process.env.LIVE_BACKEND === "true";
const backendUrl = process.env.LIVE_BACKEND_URL || "http://localhost:8080";
const email = process.env.LIVE_ADMIN_EMAIL || "admin.anphat@fams.test";
const password = process.env.LIVE_ADMIN_PASSWORD || "Admin@1234";
const evidenceDir = "docs/test-evidence/global-search-navigation";

test.describe("#17 — global search navigation (live backend)", () => {
  test.skip(!liveEnabled, "Chỉ chạy khi LIVE_BACKEND=true");
  test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

  test("search remains usable after navigating from one result", async ({ page, request }) => {
    const login = (await (await request.post(`${backendUrl}/api/v1/auth/login`, {
      data: { identifier: email, password },
    })).json()).data;
    const tid = login.activeTenantId;
    const sites = await (await request.get(`${backendUrl}/api/v1/tenants/${tid}/sites?size=5`, {
      headers: { Authorization: `Bearer ${login.accessToken}` },
    })).json();
    const site = sites.data.content[0];
    const employees = await (await request.get(`${backendUrl}/api/v1/tenants/${tid}/employees?size=20`, {
      headers: { Authorization: `Bearer ${login.accessToken}` },
    })).json();
    const employee = employees.data.content[0];
    const employeeName = `${employee.lastName} ${employee.firstName}`.trim();

    await page.addInitScript(({ accessToken, refreshToken, userId, tenantId }) => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", accessToken);
      localStorage.setItem("fams_refresh_token", refreshToken);
      localStorage.setItem("fams_user", JSON.stringify({
        id: userId, email: "e2e@fams.vn", displayName: "QA", emailVerified: true, active: true,
        createdAt: now, updatedAt: now, role: "TENANT_ADMIN", tenantId,
        permissions: ["employees:list", "sites:list", "sites:read"],
        memberships: [{ id: "m", userId, roleId: "ta", tenantId, siteIds: [], roleName: "TENANT_ADMIN" }],
      }));
    }, { accessToken: login.accessToken, refreshToken: login.refreshToken, userId: login.userId, tenantId: tid });

    await page.setViewportSize({ width: 1600, height: 900 }); // GlobalSearch shows from xl
    await page.goto("/customer/dashboard");
    await page.waitForLoadState("networkidle");

    const search = page.getByLabel("Tìm kiếm nhanh toàn hệ thống");
    await search.click();
    await search.fill(site.name.slice(0, 6));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${evidenceDir}/results.png` });

    await page.getByRole("button").filter({ hasText: site.name }).first().click();
    await page.waitForURL(new RegExp(`/customer/sites/${site.id}`), { timeout: 8000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${evidenceDir}/after-click.png` });
    expect(page.url()).toContain(`/customer/sites/${site.id}`);

    // Regression: before the fix the input remained focused while its controlled popover was
    // closed, so there was no second focus event and no result list could ever open again.
    await search.fill(employeeName);
    await expect(page.getByRole("button").filter({ hasText: employeeName }).first())
      .toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: `${evidenceDir}/second-search-after-navigation.png` });

    await page.getByRole("button").filter({ hasText: employeeName }).first().click();
    await page.waitForURL(new RegExp(`/customer/employees/${employee.id}`), { timeout: 8000 });
    expect(page.url()).toContain(`/customer/employees/${employee.id}`);
  });
});
