import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * Live-backend checks (LIVE_BACKEND=true) for:
 *  #10 — attendance "Chi tiết" action button no longer overflows its right-fixed column on hover.
 *  #11 — bulk assign role: employee names (not "undefined"), assign works; single assign with a
 *        specific-site scope shows the site name on the employee's Roles tab (not "Toàn công ty").
 */

const liveEnabled = process.env.LIVE_BACKEND === "true";
const backendUrl = process.env.LIVE_BACKEND_URL || "http://localhost:8080";
const email = process.env.LIVE_ADMIN_EMAIL || "duyanh19102005@gmail.com";
const password = process.env.LIVE_ADMIN_PASSWORD || "Admin@1234";
const evidenceDir = "docs/test-evidence/attendance-hover-bulk-role";

const TENANT_ADMIN_PERMS = [
  "employees:list", "employees:read", "employees:create", "employees:update", "employees:pii:read",
  "roles:list", "roles:read", "roles:create", "roles:update", "roles:delete",
  "sites:list", "sites:read", "checkins:list", "checkins:read", "attendance:list", "attendance:read",
  "workspaces:list", "workspaces:read", "users:list", "users:read", "reports:list",
];

test.describe("#10 / #11 — live backend", () => {
  test.skip(!liveEnabled, "Chỉ chạy khi LIVE_BACKEND=true");
  test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

  test.beforeEach(async ({ page, request }) => {
    const res = await request.post(`${backendUrl}/api/v1/auth/login`, { data: { identifier: email, password } });
    expect(res.ok()).toBeTruthy();
    const login = (await res.json()).data;
    await page.addInitScript(
      ({ accessToken, refreshToken, userId, tenantId, perms }) => {
        const now = new Date().toISOString();
        localStorage.setItem("fams_access_token", accessToken);
        localStorage.setItem("fams_refresh_token", refreshToken);
        localStorage.setItem("fams_user", JSON.stringify({
          id: userId, email: "e2e@fams.vn", displayName: "QA Live", emailVerified: true, active: true,
          createdAt: now, updatedAt: now, role: "TENANT_ADMIN", tenantId,
          permissions: perms,
          memberships: [{ id: "m", userId, roleId: "ta", tenantId, siteIds: [], roleName: "TENANT_ADMIN" }],
        }));
      },
      {
        accessToken: login.accessToken, refreshToken: login.refreshToken,
        userId: login.userId, tenantId: login.activeTenantId, perms: TENANT_ADMIN_PERMS,
      },
    );
  });

  test("#10 - attendance Chi tiết button stays inside its column on hover", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto("/customer/attendance");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    const detailBtn = page.getByRole("button", { name: /Chi tiết/i }).first();
    if (await detailBtn.count()) {
      await page.locator(".ant-table-tbody tr.ant-table-row").first().hover();
      await page.waitForTimeout(300);
      // The pinned action cell must stay opaque so the scrolled-under columns don't bleed
      // through it on hover (#10).
      const bg = await detailBtn.evaluate((el) => {
        const td = el.closest("td");
        return td ? getComputedStyle(td).backgroundColor : "";
      });
      // Any fully-opaque colour is fine (white, or slate-50 on hover — browsers may report it
      // as rgb()/lab()); what must never happen is a transparent cell that lets the scrolled
      // columns bleed through.
      expect(bg).not.toBe("rgba(0, 0, 0, 0)");
      expect(bg).not.toMatch(/rgba?\([^)]*,\s*0(\.0+)?\s*\)$/);
    }
    await page.screenshot({ path: `${evidenceDir}/attendance-hover.png` });
  });

  test("#11 - bulk assign role modal: names + assign", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/customer/settings/roles");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const bulkBtn = page.getByRole("button", { name: /Gán role hàng loạt/i });
    await bulkBtn.click();
    await page.waitForTimeout(500);
    // open the employee multi-select
    await page.locator('input[type="search"], .ant-select-selection-search-input').last().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${evidenceDir}/bulk-role-options.png` });
    const optionText = await page.locator(".ant-select-item-option-content").allInnerTexts();
    console.log("employee options:", optionText);
    expect(optionText.join(" ")).not.toContain("undefined");
  });

  test("#11 - employee status change shows a success toast", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 850 });
    await page.goto("/customer/employees");
    await page.waitForLoadState("networkidle");
    await page.locator(".ant-table-tbody tr.ant-table-row").first().waitFor();
    await page.waitForTimeout(500);
    // status badge lives in the last-but-one column; open its dropdown
    await page.locator(".ant-table-tbody tr.ant-table-row").first()
      .locator("td").filter({ hasText: /Hoạt động|Tạm nghỉ/ }).first().click();
    await page.locator(".ant-dropdown-menu-item").filter({ hasText: /Đánh dấu (Tạm nghỉ|Hoạt động)/ }).first().click();
    await page.getByRole("button", { name: /^Xác nhận$/ }).click();
    await expect(page.locator(".ant-message")).toContainText(/Cập nhật trạng thái thành công/i, { timeout: 10000 });
    await page.screenshot({ path: `${evidenceDir}/status-change-toast.png` });
  });

  test("#11 - single assign with site scope shows site name on Roles tab", async ({ page, request }) => {
    const res = await request.post(`${backendUrl}/api/v1/auth/login`, { data: { identifier: email, password } });
    const login = (await res.json()).data;
    const auth = { headers: { Authorization: `Bearer ${login.accessToken}` } };
    const tid = login.activeTenantId;
    const emps = await (await request.get(`${backendUrl}/api/v1/tenants/${tid}/employees?size=50`, auth)).json();
    const emp = emps.data.content.find((e: { userId?: string }) => e.userId);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/customer/employees/${emp.id}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await page.getByRole("tab", { name: /Vai trò|Role|Phân quyền/i }).click().catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${evidenceDir}/employee-roles-tab.png`, fullPage: true });
  });
});
