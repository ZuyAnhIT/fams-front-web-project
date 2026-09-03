import { mkdirSync } from "node:fs";
import { test, type Page } from "@playwright/test";

/**
 * #08 — company logo is a real file upload (not a "paste a URL" field).
 * #09 — the HR dashboard surfaces the actual failure reason (IP allow-list / permission)
 *        instead of always blaming a missing permission.
 */

const evidenceDir = "docs/test-evidence/tenant-logo-dashboard";
const api = (data: unknown) => ({ success: true, message: "Success", data });
const tenantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

mkdirSync(evidenceDir, { recursive: true });

async function seed(page: Page) {
  await page.addInitScript(
    ({ tid, uid }) => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", "logo-e2e");
      localStorage.setItem("fams_refresh_token", "logo-e2e-r");
      localStorage.setItem(
        "fams_user",
        JSON.stringify({
          id: uid, email: "owner@fams.vn", displayName: "Vũ Hà",
          emailVerified: true, active: true, createdAt: now, updatedAt: now,
          role: "TENANT_ADMIN", tenantId: tid,
          permissions: ["employees:list", "tenants:update"],
          memberships: [{ id: "m", userId: uid, roleId: "ta", tenantId: tid, siteIds: [] }],
        }),
      );
    },
    { tid: tenantId, uid: userId },
  );
}

const tenantDetail = (logoUrl: string | null) => ({
  id: tenantId, name: "Công ty CP Xây dựng Hoàng Long", slug: "hoang-long", industry: "Xây dựng",
  status: "ACTIVE", ownerId: userId, createdAt: "2026-01-01T00:00:00Z",
  timezone: "Asia/Ho_Chi_Minh", locale: "vi", currencyCode: "VND", logoUrl,
  currentEmployeeCount: 40, currentSiteCount: 13, currentMonthRandomChecks: 0, currentStorageGb: 1,
});

// #09 — dashboard shows IP allow-list reason
test("#09 - HR dashboard: IP allow-list 403 shows the real reason", async ({ page }) => {
  await seed(page);
  await page.route("**/api/v1/**", (route) => {
    const url = route.request().url();
    if (url.includes("/notifications")) return route.fulfill({ json: api({ items: [], unreadCount: 0, totalElements: 0 }) });
    if (/\/dashboard\/hr/.test(url)) {
      return route.fulfill({
        status: 403,
        json: {
          success: false, data: null, errorCode: "IP_NOT_WHITELISTED",
          message: "Access from this IP address is not allowed for this tenant",
          userMessage: "Truy cập bị từ chối do địa chỉ IP không nằm trong danh sách cho phép của công ty bạn.",
        },
      });
    }
    if (url.includes("/sites")) return route.fulfill({ json: api({ content: [], totalElements: 0, page: 0, size: 100, totalPages: 0, first: true, last: true }) });
    return route.fulfill({ json: api(null) });
  });
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/customer/dashboard");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${evidenceDir}/dashboard-ip-blocked.png` });
});

// #08 — company logo uploader
test("#08 - company config shows a logo uploader, not a URL field", async ({ page }) => {
  await seed(page);
  let uploadHit = false;
  await page.route("**/api/v1/**", (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes("/notifications")) return route.fulfill({ json: api({ items: [], unreadCount: 0, totalElements: 0 }) });
    if (/\/tenants\/[^/]+\/logo/.test(url) && method === "POST") {
      uploadHit = true;
      return route.fulfill({ json: api({ ...tenantDetail("http://localhost:9000/fams-avatars/logos/x.png"), currencyCode: "VND" }) });
    }
    if (/\/tenants\/[^/]+\/detail/.test(url)) return route.fulfill({ json: api(tenantDetail(null)) });
    if (/\/tenants\/[^/]+\/settings/.test(url)) return route.fulfill({ json: api({}) });
    if (/\/tenants\/[^/]+\/ip-whitelists/.test(url)) return route.fulfill({ json: api({ content: [], totalElements: 0 }) });
    return route.fulfill({ json: api(null) });
  });
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto("/customer/settings/tenant");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${evidenceDir}/company-config-logo-uploader.png`, fullPage: true });

  // exercise the upload
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${evidenceDir}/company-config-after-upload.png` });
  if (!uploadHit) throw new Error("logo upload endpoint was never called");
});
