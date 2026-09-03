import { mkdirSync } from "node:fs";
import { test, type Page } from "@playwright/test";

/**
 * Visual audit for issues #02 (list-page filter/search bars not responsive) and
 * #03 (account chip name/role truncated to "..." for long values).
 *
 * Not an assertion suite — it drives the real pages at phone / tablet / desktop
 * widths with a deliberately long display name and role so the screenshots in
 * docs/test-evidence/responsive-list-header/ can be eyeballed before vs after.
 */

const evidenceDir = "docs/test-evidence/responsive-list-header";
const tenantId = "11111111-1111-4111-8111-111111111111";
const api = (data: unknown) => ({ success: true, message: "Success", data });
const pageData = (content: unknown[]) => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
  first: true,
  last: true,
});

const LONG_NAME = "Nguyễn Thị Hoàng Yến Trân Phương Thảo";

async function seedUser(page: Page) {
  await page.addInitScript(
    ({ name, tenant }) => {
      const now = new Date().toISOString();
      localStorage.setItem("fams_access_token", "resp-e2e-access");
      localStorage.setItem("fams_refresh_token", "resp-e2e-refresh");
      localStorage.setItem(
        "fams_user",
        JSON.stringify({
          id: "user-e2e",
          email: "nguyen.thi.hoang.yen.tran.phuong.thao@congtyxaydunglonghau.com",
          displayName: name,
          emailVerified: true,
          active: true,
          createdAt: now,
          updatedAt: now,
          role: "HR_MANAGER",
          tenantId: tenant,
          permissions: [
            "employees:create",
            "employees:read",
            "employees:update",
            "employees:list",
            "roles:read",
          ],
          memberships: [
            { id: "m", userId: "user-e2e", roleId: "hr", tenantId: tenant, siteIds: [] },
          ],
        }),
      );
    },
    { name: LONG_NAME, tenant: tenantId },
  );
}

const employees = Array.from({ length: 6 }).map((_, i) => ({
  id: `emp-${i}`,
  tenantId,
  userId: null,
  firstName: "An",
  lastName: `Nguyễn ${i}`,
  fullName: `Nguyễn ${i} An`,
  email: `an${i}@example.com`,
  employeeCode: `NV00${i}`,
  department: "Vận hành",
  position: "Kỹ sư",
  status: "active",
  createdAt: "2026-07-25T01:00:00Z",
  updatedAt: "2026-07-25T01:00:00Z",
  faceId: { status: "enrolled", consentGiven: true },
}));

const WIDTHS: Array<{ label: string; size: { width: number; height: number } }> = [
  { label: "phone-375", size: { width: 375, height: 812 } },
  { label: "tablet-768", size: { width: 768, height: 1024 } },
  { label: "laptop-1024", size: { width: 1024, height: 800 } },
  { label: "desktop-1440", size: { width: 1440, height: 900 } },
];

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

test.beforeEach(async ({ page }) => {
  await seedUser(page);
  await page.route("**/api/v1/**", (route) => {
    const url = route.request().url();
    if (url.includes("/notifications")) {
      return route.fulfill({ json: api({ items: [], unreadCount: 0, totalElements: 0 }) });
    }
    if (/\/employees(\?|$)/.test(url)) {
      return route.fulfill({ json: api(pageData(employees)) });
    }
    if (url.includes("/workspaces")) {
      return route.fulfill({ json: api(pageData([{ id: "w1", name: "Khối văn phòng" }])) });
    }
    if (url.includes("/saved-filters")) {
      return route.fulfill({ json: api([]) });
    }
    return route.fulfill({ json: api(null) });
  });
});

for (const { label, size } of WIDTHS) {
  test(`employees list @ ${label}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/customer/employees");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${evidenceDir}/employees-${label}.png`, fullPage: false });
    const header = page.locator("header").first();
    if (await header.count()) {
      await header.screenshot({ path: `${evidenceDir}/header-${label}.png` });
    }
  });
}

// Admin directory: verifies the pages where an intermediate wrapper <div> around the
// filters was removed still lay out correctly through the shared ListHeader grid.
async function seedPlatformAdmin(page: Page) {
  await page.addInitScript(({ name }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "resp-e2e-access");
    localStorage.setItem("fams_refresh_token", "resp-e2e-refresh");
    localStorage.setItem(
      "fams_user",
      JSON.stringify({
        id: "user-e2e",
        email: "platform.admin@fams.vn",
        displayName: name,
        emailVerified: true,
        active: true,
        createdAt: now,
        updatedAt: now,
        role: "PLATFORM_ADMIN",
        tenantId: null,
        permissions: ["users:list", "users:read", "tenants:list", "tenants:read"],
        memberships: [],
      }),
    );
  }, { name: LONG_NAME });
}

for (const width of [375, 768, 1440]) {
  test(`admin users directory @ ${width}`, async ({ page }) => {
    await seedPlatformAdmin(page);
    await page.route("**/api/v1/**", (route) => {
      const url = route.request().url();
      if (url.includes("/notifications")) {
        return route.fulfill({ json: api({ items: [], unreadCount: 0, totalElements: 0 }) });
      }
      if (url.includes("/users")) {
        return route.fulfill({ json: api(pageData([])) });
      }
      return route.fulfill({ json: api(null) });
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${evidenceDir}/admin-users-${width}.png`, fullPage: false });
  });
}
