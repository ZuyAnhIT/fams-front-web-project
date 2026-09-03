import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * Live-backend follow-ups (LIVE_BACKEND=true):
 *  #12 — a site-scoped role shows the site name AND an assignment date on the Roles tab.
 *  #14 — an EMPLOYEE-role account with no employee profile in the active company gets a
 *        helpful state (info + permission shortcuts), not a dead-end red error.
 */

const liveEnabled = process.env.LIVE_BACKEND === "true";
const backendUrl = process.env.LIVE_BACKEND_URL || "http://localhost:8080";
const evidenceDir = "docs/test-evidence/dashboard-role-scope-followups";

test.describe("#12 / #14 — live backend", () => {
  test.skip(!liveEnabled, "Chỉ chạy khi LIVE_BACKEND=true");
  test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

  test("#12 - site-scoped role: site name + assignment date on Roles tab", async ({ page, request }) => {
    const login = (await (await request.post(`${backendUrl}/api/v1/auth/login`, {
      data: { identifier: "duyanh19102005@gmail.com", password: "Admin@1234" },
    })).json()).data;
    const auth = { headers: { Authorization: `Bearer ${login.accessToken}` } };
    const tid = login.activeTenantId;

    const [emps, roles, sites] = await Promise.all([
      (await request.get(`${backendUrl}/api/v1/tenants/${tid}/employees?size=50`, auth)).json(),
      (await request.get(`${backendUrl}/api/v1/roles?tenantId=${tid}&size=100`, auth)).json(),
      (await request.get(`${backendUrl}/api/v1/tenants/${tid}/sites?size=5`, auth)).json(),
    ]);
    const emp = emps.data.content.find((e: { userId?: string }) => e.userId);
    const supRole = roles.data.content.find((r: { name: string }) => r.name === "SITE_SUPERVISOR");
    const site = sites.data.content[0];

    // assign SITE_SUPERVISOR scoped to one site (idempotent-ish: ignore "already has role")
    await request.post(`${backendUrl}/api/v1/user-roles`, {
      ...auth,
      data: { userId: emp.userId, roleId: supRole.id, tenantId: tid, siteIds: [site.id] },
    });

    await page.addInitScript(
      ({ accessToken, refreshToken, userId, tenantId }) => {
        const now = new Date().toISOString();
        localStorage.setItem("fams_access_token", accessToken);
        localStorage.setItem("fams_refresh_token", refreshToken);
        localStorage.setItem("fams_user", JSON.stringify({
          id: userId, email: "e2e@fams.vn", displayName: "QA", emailVerified: true, active: true,
          createdAt: now, updatedAt: now, role: "TENANT_ADMIN", tenantId,
          permissions: ["employees:list", "employees:read", "roles:read", "roles:update", "sites:list", "sites:read"],
          memberships: [{ id: "m", userId, roleId: "ta", tenantId, siteIds: [], roleName: "TENANT_ADMIN" }],
        }));
      },
      { accessToken: login.accessToken, refreshToken: login.refreshToken, userId: login.userId, tenantId: tid },
    );

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/customer/employees/${emp.id}`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("tab", { name: /Vai trò|Phân quyền/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${evidenceDir}/roles-tab.png`, fullPage: true });

    const rowText = await page.locator(".ant-table-tbody tr.ant-table-row").filter({ hasText: "SITE_SUPERVISOR" }).innerText();
    expect(rowText).toContain(site.name);         // #12a — site name, not "Toàn công ty"
    expect(rowText).not.toContain("Toàn công ty");
    expect(rowText).toMatch(/\d{2}\/\d{2}\/\d{4}/); // #12b — assignment date is shown

    // cleanup
    const detail = await (await request.get(`${backendUrl}/api/v1/tenants/${tid}/employees/${emp.id}`, auth)).json();
    const sup = detail.data.roles.find((r: { roleName: string }) => r.roleName === "SITE_SUPERVISOR");
    if (sup) await request.delete(`${backendUrl}/api/v1/user-roles/${sup.id}`, auth);
  });

  test("#14 - employee dashboard: no-profile 404 renders a helpful state", async ({ page }) => {
    // Seed an EMPLOYEE-role user for a tenant, mock the dashboard endpoint as 404.
    await page.addInitScript(() => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", "e2e");
      localStorage.setItem("fams_refresh_token", "e2e-r");
      localStorage.setItem("fams_user", JSON.stringify({
        id: "u1", email: "emp@fams.vn", displayName: "Nhân Viên", emailVerified: true, active: true,
        createdAt: now, updatedAt: now, role: "EMPLOYEE", tenantId: "11111111-1111-4111-8111-111111111111",
        permissions: ["checkins:create", "checkins:read", "notifications:list"],
        memberships: [{ id: "m", userId: "u1", roleId: "e", tenantId: "11111111-1111-4111-8111-111111111111", siteIds: [] }],
      }));
    });
    await page.route("**/api/v1/**", (route) => {
      const url = route.request().url();
      if (url.includes("/notifications")) return route.fulfill({ json: { success: true, data: { items: [], unreadCount: 0, totalElements: 0 } } });
      if (url.includes("/dashboard/employee")) {
        return route.fulfill({ status: 404, json: { success: false, data: null, errorCode: "RESOURCE_NOT_FOUND", message: "No employee profile" } });
      }
      return route.fulfill({ json: { success: true, data: null } });
    });
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/customer/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${evidenceDir}/employee-dashboard-no-profile.png` });
    await expect(page.getByText(/chưa được gắn với hồ sơ nhân viên/i)).toBeVisible();
    // it must NOT be the old red "Không thể tải" error
    await expect(page.getByText("Không thể tải Dashboard nhân viên")).toHaveCount(0);
  });
});
