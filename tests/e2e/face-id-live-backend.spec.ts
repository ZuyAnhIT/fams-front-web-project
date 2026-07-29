import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const liveEnabled = process.env.LIVE_BACKEND === "true";
const backendUrl = process.env.LIVE_BACKEND_URL || "http://localhost:8080";
const tenantId =
  process.env.LIVE_TENANT_ID || "9c411c62-3e4f-4358-9bd4-dba4ddacf153";
const evidenceDir = "docs/test-evidence/face-id-management";

test.describe("Face ID với Backend thật", () => {
  test.skip(!liveEnabled, "Chỉ chạy khi LIVE_BACKEND=true");

  test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

  test("Platform Admin tải hàng đợi và JPEG qua Bearer token", async ({
    page,
    request,
  }) => {
    const loginResponse = await request.post(
      `${backendUrl}/api/v1/auth/login`,
      {
        data: {
          identifier: process.env.LIVE_ADMIN_EMAIL || "admin@fams.com",
          password: process.env.LIVE_ADMIN_PASSWORD || "Admin@1234",
        },
      },
    );
    expect(loginResponse.ok()).toBeTruthy();
    const login = await loginResponse.json();
    expect(login.success).toBe(true);

    await page.addInitScript(
      ({ accessToken, refreshToken, seededTenant, userId }) => {
        const now = new Date().toISOString();
        localStorage.setItem("fams_access_token", accessToken);
        localStorage.setItem("fams_refresh_token", refreshToken);
        localStorage.setItem(
          "fams_user",
          JSON.stringify({
            id: userId,
            email: "admin@fams.com",
            displayName: "Platform Admin Live",
            emailVerified: true,
            active: true,
            createdAt: now,
            updatedAt: now,
            role: "PLATFORM_ADMIN",
            tenantId: seededTenant,
            permissions: [],
            memberships: [],
          }),
        );
      },
      {
        accessToken: login.data.accessToken,
        refreshToken: login.data.refreshToken,
        userId: login.data.userId,
        seededTenant: tenantId,
      },
    );

    await page.goto("/customer/reports/face-id-enrollment");
    await expect(
      page.getByRole("heading", { name: "Quản lý Face ID" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Chờ duyệt/ }).click();

    const firstReviewImage = page
      .getByRole("img", { name: /Ảnh Face ID chờ duyệt/ })
      .first();
    await expect(firstReviewImage).toBeVisible();
    await expect
      .poll(() =>
        firstReviewImage.evaluate(
          (image) => (image as HTMLImageElement).naturalWidth,
        ),
      )
      .toBeGreaterThan(0);

    await page.screenshot({
      path: `${evidenceDir}/03-live-backend-review-photo.png`,
      fullPage: true,
    });
  });
});
