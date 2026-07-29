import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/face-id-management";
const tenantId = "11111111-1111-4111-8111-111111111111";
const employeeId = "22222222-2222-4222-8222-222222222222";
const rejectedEmployeeId = "33333333-3333-4333-8333-333333333333";

const api = (data: unknown) => ({ success: true, message: "Success", data });

async function seedHr(page: Page) {
  await page.addInitScript(({ seededTenant }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "face-id-e2e-access");
    localStorage.setItem("fams_refresh_token", "face-id-e2e-refresh");
    localStorage.setItem(
      "fams_user",
      JSON.stringify({
        id: "hr-user",
        email: "hr@example.com",
        displayName: "HR Face ID",
        emailVerified: true,
        active: true,
        createdAt: now,
        updatedAt: now,
        role: "HR_MANAGER",
        tenantId: seededTenant,
        permissions: ["reports:list", "face_id:manage", "employees:read"],
        memberships: [],
      }),
    );
  }, { seededTenant: tenantId });
}

const pendingRows = [
  {
    employeeId,
    employeeCode: "NV-FACE-01",
    employeeName: "Nguyễn An",
    status: "not_enrolled",
    consentGiven: true,
    consentGivenAt: "2026-07-28T01:00:00Z",
    enrolledAt: null,
    revokedAt: null,
    reviewStatus: "pending",
    pendingPhotoCount: 3,
    submittedAt: "2026-07-28T02:00:00Z",
    reviewedAt: null,
    rejectionReason: null,
  },
  {
    employeeId: rejectedEmployeeId,
    employeeCode: "NV-FACE-02",
    employeeName: "Trần Bình",
    status: "enrolled",
    consentGiven: true,
    consentGivenAt: "2026-06-01T01:00:00Z",
    enrolledAt: "2026-06-01T02:00:00Z",
    revokedAt: null,
    reviewStatus: "pending",
    pendingPhotoCount: 4,
    submittedAt: "2026-07-28T03:00:00Z",
    reviewedAt: null,
    rejectionReason: null,
  },
];

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    if (route.request().url().includes("/notifications")) {
      return route.fulfill({ json: api({ items: [], unreadCount: 0 }) });
    }
    return route.fulfill({ json: api(null) });
  });
});

test("HR xem đúng trạng thái đã duyệt và trạng thái review độc lập", async ({ page }) => {
  await seedHr(page);
  await page.route(
    `**/api/v1/tenants/${tenantId}/reports/face-id/enrollment?*`,
    (route) =>
      route.fulfill({
        json: api({
          totalEmployees: 2,
          enrolledCount: 1,
          pendingCount: 1,
          notEnrolledCount: 1,
          revokedCount: 0,
          statusFilter: null,
          records: {
            content: [
              {
                employeeId,
                employeeCode: "NV-FACE-01",
                firstName: "An",
                lastName: "Nguyễn",
                email: "an@example.com",
                department: "Vận hành",
                faceIdStatus: "enrolled",
                consentGiven: true,
                consentGivenAt: "2026-06-01T01:00:00Z",
                enrolledAt: "2026-06-01T02:00:00Z",
                revokedAt: null,
                reviewStatus: "pending",
                submittedAt: "2026-07-28T02:00:00Z",
                rejectionReason: null,
              },
            ],
            page: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
          },
        }),
      }),
  );

  await page.goto("/customer/reports/face-id-enrollment");
  await expect(page.getByRole("heading", { name: "Quản lý Face ID" })).toBeVisible();
  await expect(page.getByText("Đã đăng ký", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("Chờ HR duyệt", { exact: true })).toBeVisible();
  await expect(page.getByText("Chờ duyệt").first()).toBeVisible();
  await page.screenshot({
    path: `${evidenceDir}/01-report-approved-and-review-status.png`,
    fullPage: true,
  });
});

test("HR duyệt và từ chối hàng đợi theo đúng API contract", async ({ page }) => {
  await seedHr(page);
  let approvedEmployeeId = "";
  let rejectedBody: Record<string, unknown> = {};
  let photoAuthorization = "";

  await page.route(
    `**/api/v1/tenants/${tenantId}/reports/face-id/enrollment?*`,
    (route) =>
      route.fulfill({
        json: api({
          totalEmployees: 2,
          enrolledCount: 1,
          pendingCount: 2,
          notEnrolledCount: 1,
          revokedCount: 0,
          statusFilter: null,
          records: {
            content: [],
            page: 0,
            size: 20,
            totalElements: 0,
            totalPages: 0,
          },
        }),
      }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/face-id/pending-review`,
    (route) => route.fulfill({ json: api(pendingRows) }),
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/employees/*/face-id/pending-review/photo`,
    (route) => {
      photoAuthorization = route.request().headers().authorization || "";
      return route.fulfill({
        contentType: "image/jpeg",
        body: Buffer.from(
          "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EH//2Q==",
          "base64",
        ),
      });
    },
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/employees/${employeeId}/face-id/approve`,
    (route) => {
      approvedEmployeeId = employeeId;
      return route.fulfill({ json: api({ ...pendingRows[0], reviewStatus: "none" }) });
    },
  );
  await page.route(
    `**/api/v1/tenants/${tenantId}/employees/${rejectedEmployeeId}/face-id/reject`,
    (route) => {
      rejectedBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        json: api({ ...pendingRows[1], reviewStatus: "rejected" }),
      });
    },
  );

  await page.goto("/customer/reports/face-id-enrollment");
  await page.getByRole("button", { name: /Chờ duyệt/ }).click();
  await expect(page.getByText("Đối chiếu ảnh trước khi quyết định")).toBeVisible();
  await expect(
    page.getByAltText("Ảnh Face ID chờ duyệt của Nguyễn An"),
  ).toBeVisible();
  await expect.poll(() => photoAuthorization).toBe("Bearer face-id-e2e-access");

  const firstRow = page.getByRole("row").filter({ hasText: "NV-FACE-01" });
  await firstRow
    .getByRole("button", { name: "Duyệt", exact: true })
    .click();
  await page.getByRole("button", { name: "Duyệt hồ sơ" }).click();
  await expect.poll(() => approvedEmployeeId).toBe(employeeId);

  const secondRow = page.getByRole("row").filter({ hasText: "NV-FACE-02" });
  await secondRow
    .getByRole("button", { name: "Từ chối", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Lý do từ chối Face ID")
    .fill("Ảnh quá tối, vui lòng đăng ký lại ở nơi đủ sáng.");
  await page.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect.poll(() => rejectedBody).toEqual({
    reason: "Ảnh quá tối, vui lòng đăng ký lại ở nơi đủ sáng.",
  });

  await page.screenshot({
    path: `${evidenceDir}/02-review-queue.png`,
    fullPage: true,
  });
});
