import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * #audit-readability — the audit log list + its detail modal must show representative names
 * (employee / site / actor) and Vietnamese labels, not raw UUIDs or English action keys.
 * (Excel export headers are verified separately — see docs README.) Live backend.
 */

const liveEnabled = process.env.LIVE_BACKEND === "true";
const backendUrl = process.env.LIVE_BACKEND_URL || "http://localhost:8080";
const evidenceDir = "docs/test-evidence/audit-export-readability";
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

test.describe("#audit-readability — live backend", () => {
  test.skip(!liveEnabled, "Chỉ chạy khi LIVE_BACKEND=true");
  test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

  test("audit log list shows actor + entity NAMES, not UUIDs", async ({ page, request }) => {
    const login = (await (await request.post(`${backendUrl}/api/v1/auth/login`, {
      data: { identifier: "duyanh19102005@gmail.com", password: "Admin@1234" },
    })).json()).data;
    await page.addInitScript(({ accessToken, refreshToken, userId, tenantId }) => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", accessToken);
      localStorage.setItem("fams_refresh_token", refreshToken);
      localStorage.setItem("fams_user", JSON.stringify({
        id: userId, email: "e2e@fams.vn", displayName: "QA", emailVerified: true, active: true,
        createdAt: now, updatedAt: now, role: "TENANT_ADMIN", tenantId,
        permissions: ["audit:list", "audit:read"],
        memberships: [{ id: "m", userId, roleId: "ta", tenantId, siteIds: [], roleName: "TENANT_ADMIN" }],
      }));
    }, { accessToken: login.accessToken, refreshToken: login.refreshToken, userId: login.userId, tenantId: login.activeTenantId });

    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto("/customer/audit-logs");
    await page.waitForLoadState("networkidle");
    await page.locator(".ant-table-tbody tr.ant-table-row").first().waitFor();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${evidenceDir}/audit-list.png` });

    // Check the actor / action / entity cells only — Request ID is legitimately a UUID.
    const firstRow = page.locator(".ant-table-tbody tr.ant-table-row").first();
    const actorEntityAction = (await firstRow.locator("td").nth(1).innerText())
      + " " + (await firstRow.locator("td").nth(2).innerText())
      + " " + (await firstRow.locator("td").nth(3).innerText());
    expect(actorEntityAction).not.toMatch(UUID_RE); // names/labels, not bare UUIDs
    const body = await page.locator(".ant-table-tbody").innerText();
    expect(body).not.toContain("role_assigned"); // action column is Vietnamese
    expect(body).not.toContain("employee_status_changed");

    await page.getByRole("button", { name: /^Xem$/ }).first().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${evidenceDir}/audit-detail.png` });
    const modal = page.locator(".ant-modal-content, .ant-modal");
    if (await modal.count()) {
      expect(await modal.first().innerText()).not.toContain("role_assigned");
    }
  });
});
