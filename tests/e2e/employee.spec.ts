import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/employee";
const tenantId = "11111111-1111-4111-8111-111111111111";
const employeeId = "22222222-2222-4222-8222-222222222222";
const roleId = "33333333-3333-4333-8333-333333333333";

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

async function seedHr(page: Page) {
  await page.addInitScript(({ seededTenantId }) => {
    const now = new Date().toISOString();
    const permissions = [
      "employees:list",
      "employees:read",
      "employees:create",
      "employees:update",
    ];
    localStorage.setItem("fams_access_token", "employee-e2e-access");
    localStorage.setItem("fams_refresh_token", "employee-e2e-refresh");
    localStorage.setItem(
      "fams_user",
      JSON.stringify({
        id: "hr-user",
        email: "hr@example.com",
        emailVerified: true,
        phone: null,
        phoneVerified: false,
        displayName: "HR E2E",
        avatarUrl: null,
        active: true,
        createdAt: now,
        updatedAt: now,
        role: "HR_MANAGER",
        tenantId: seededTenantId,
        permissions,
        memberships: [
          {
            id: "membership",
            userId: "hr-user",
            roleId: "hr-role",
            roleName: "HR_MANAGER",
            tenantId: seededTenantId,
            permissions,
          },
        ],
      }),
    );
  }, { seededTenantId: tenantId });
}

async function seedPlatformAdmin(page: Page) {
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "platform-e2e-access");
    localStorage.setItem("fams_refresh_token", "platform-e2e-refresh");
    localStorage.setItem(
      "fams_user",
      JSON.stringify({
        id: "platform-admin",
        email: "admin@fams.vn",
        emailVerified: true,
        phone: null,
        phoneVerified: false,
        displayName: "Platform Admin",
        avatarUrl: null,
        active: true,
        platformAdmin: true,
        createdAt: now,
        updatedAt: now,
        role: "PLATFORM_ADMIN",
        tenantId: null,
        permissions: [],
        memberships: [],
      }),
    );
  });
}

const employee = {
  id: employeeId,
  userId: "employee-user",
  tenantId,
  email: "an@example.com",
  firstName: "An",
  lastName: "Nguyễn",
  fullName: "Nguyễn An",
  employeeCode: "NV001",
  department: "Kỹ thuật",
  position: "Kỹ sư",
  status: "active",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-20T00:00:00Z",
  faceId: { status: "enrolled", consentGiven: true },
};

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    if (route.request().url().includes("/notifications")) {
      return route.fulfill({ json: api({ items: [], unreadCount: 0 }) });
    }
    return route.fulfill({ json: api(null) });
  });
});

test("HR mời nhân viên và gửi đủ email, điện thoại, role", async ({ page }) => {
  await seedHr(page);
  let invitationBody: Record<string, unknown> = {};

  await page.route(`**/api/v1/tenants/${tenantId}/employees?*`, (route) =>
    route.fulfill({ json: api(pageData([employee])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/invitations?*`, (route) =>
    route.fulfill({ json: api(pageData([])) }),
  );
  await page.route("**/api/v1/roles?*", (route) =>
    route.fulfill({
      json: api(
        pageData([
          {
            id: roleId,
            name: "EMPLOYEE",
            description: "Nhân viên",
            isSystem: true,
            isActive: true,
            tenantId: null,
            permissionCount: 1,
            assignmentCount: 0,
          },
        ]),
      ),
    }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/invitations`, async (route) => {
    invitationBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      json: api({
        id: "invitation",
        tenantId,
        status: "pending",
        createdAt: employee.createdAt,
        expiresAt: employee.updatedAt,
        ...invitationBody,
      }),
    });
  });

  await page.goto("/customer/employees");
  await expect(page.getByText("Nguyễn An")).toBeVisible();
  await page.getByRole("button", { name: /Mời tham gia/ }).click();
  await page.getByLabel("Địa chỉ Email").fill("new.employee@example.com");
  await page.getByLabel("Số điện thoại (Tùy chọn)").fill("0912345678");
  const roleSelect = page.getByRole("dialog").getByLabel("Vai trò (Role)");
  await roleSelect.click();
  await page.getByText("EMPLOYEE", { exact: true }).last().click();
  await page.getByRole("button", { name: "Gửi lời mời" }).click();

  await expect.poll(() => invitationBody).toMatchObject({
    email: "new.employee@example.com",
    phone: "0912345678",
    roleId,
  });
  await page.screenshot({
    path: `${evidenceDir}/01-tenant-invitation.png`,
    fullPage: true,
  });
});

test("Chi tiết HR hiển thị role, workspace, assignment và Face ID", async ({ page }) => {
  await seedHr(page);
  await page.route(
    `**/api/v1/tenants/${tenantId}/employees/${employeeId}`,
    (route) =>
      route.fulfill({
        json: api({
          ...employee,
          roles: [],
          workspaces: [
            {
              id: "workspace-member",
              workspaceId: "workspace-1",
              workspaceName: "Khối Kỹ thuật",
              role: "MEMBER",
              assignedAt: employee.createdAt,
            },
          ],
          assignments: [
            {
              id: "assignment-1",
              tenantId,
              siteId: "site-1",
              employeeId,
              startDate: "2026-07-01",
              endDate: null,
              daysOfWeek: ["MONDAY", "FRIDAY"],
              role: "Kỹ sư hiện trường",
              status: "active",
              notes: "Ca ngày",
              createdAt: employee.createdAt,
              updatedAt: employee.updatedAt,
            },
          ],
        }),
      }),
  );

  await page.goto(`/customer/employees/${employeeId}`);
  await page.getByRole("tab", { name: /Workspace & Phân công/ }).click();
  await expect(page.getByText("Khối Kỹ thuật")).toBeVisible();
  await expect(page.getByText("Kỹ sư hiện trường")).toBeVisible();
  await expect(page.getByText(/T2, T6/)).toBeVisible();
  await page.getByRole("tab", { name: /Sinh trắc học/ }).click();
  await expect(page.getByText(/Đã đăng ký/)).toBeVisible();
  await page.screenshot({
    path: `${evidenceDir}/02-employee-detail.png`,
    fullPage: true,
  });
});

test("Link lời mời tenant mới hiển thị form kích hoạt và gửi token", async ({ page }) => {
  const token = "44444444-4444-4444-8444-444444444444";
  let acceptBody: Record<string, unknown> = {};

  await page.route("**/api/v1/invitations/validate?*", (route) =>
    route.fulfill({
      json: api({
        email: "invitee@example.com",
        tenantName: "Acme Việt Nam",
        isExistingUser: false,
        isExistingPhoneUser: false,
      }),
    }),
  );
  await page.route("**/api/v1/invitations/accept", async (route) => {
    acceptBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 400,
      json: { success: false, message: "E2E stops before session creation", data: null },
    });
  });

  await page.goto(`/accept-invite?type=tenant&token=${token}`);
  await expect(page.getByText("Gia nhập Acme Việt Nam")).toBeVisible();
  await page.getByLabel("Mật khẩu mới").fill("Password1");
  await page.getByLabel("Xác nhận mật khẩu").fill("Password1");
  await page.getByRole("button", { name: "Kích hoạt tài khoản" }).click();
  await expect.poll(() => acceptBody).toMatchObject({ token, password: "Password1" });
  await page.screenshot({
    path: `${evidenceDir}/03-public-accept-invite.png`,
    fullPage: true,
  });
});

test("Platform Admin gửi và hủy lời mời nhân sự nền tảng", async ({ page }) => {
  await seedPlatformAdmin(page);
  let sendBody: Record<string, unknown> = {};
  let cancelledId = "";

  await page.route("**/api/v1/users?*", (route) =>
    route.fulfill({ json: api(pageData([])) }),
  );
  await page.route("**/api/v1/roles?*", (route) =>
    route.fulfill({
      json: api(
        pageData([
          {
            id: roleId,
            name: "PLATFORM_STAFF",
            description: "Nhân sự nền tảng",
            isSystem: true,
            isActive: true,
            tenantId: null,
            permissionCount: 1,
            assignmentCount: 0,
          },
        ]),
      ),
    }),
  );
  await page.route("**/api/v1/platform/invitations?*", (route) =>
    route.fulfill({
      json: api(
        pageData([
          {
            id: "pending-platform-invite",
            email: "old.staff@fams.vn",
            status: "pending",
            invitedBy: "platform-admin",
            roleId,
            expiresAt: "2026-08-01T00:00:00Z",
            createdAt: "2026-07-25T00:00:00Z",
            updatedAt: "2026-07-25T00:00:00Z",
          },
        ]),
      ),
    }),
  );
  await page.route("**/api/v1/platform/invitations", async (route) => {
    sendBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 201, json: api({ id: "new-invite", ...sendBody }) });
  });
  await page.route("**/api/v1/platform/invitations/*", async (route) => {
    cancelledId = route.request().url().split("/").pop() ?? "";
    await route.fulfill({ json: api({ id: cancelledId, status: "cancelled" }) });
  });

  await page.goto("/admin/users");
  await page.getByRole("tab", { name: /Lời mời nền tảng/ }).click();
  await expect(page.getByText("old.staff@fams.vn")).toBeVisible();
  await page.getByRole("button", { name: "Mời nhân sự nền tảng" }).click();
  await page.getByLabel("Email").fill("new.staff@fams.vn");
  await page.getByRole("dialog").getByRole("button", { name: "Gửi lời mời" }).click();
  await expect.poll(() => sendBody).toMatchObject({ email: "new.staff@fams.vn" });

  await page
    .locator("tr", { hasText: "old.staff@fams.vn" })
    .getByRole("button", { name: "Hủy" })
    .click();
  await page.getByRole("button", { name: "Hủy lời mời" }).click();
  await expect.poll(() => cancelledId).toBe("pending-platform-invite");
  await page.screenshot({
    path: `${evidenceDir}/04-platform-invitations.png`,
    fullPage: true,
  });
});
