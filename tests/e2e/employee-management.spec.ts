import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/employee-management";
const tenantId = "11111111-1111-4111-8111-111111111111";
const employeeId = "22222222-2222-4222-8222-222222222222";
const roleId = "33333333-3333-4333-8333-333333333333";
const invitationId = "44444444-4444-4444-8444-444444444444";

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

async function seedUser(page: Page, role: "TENANT_ADMIN" | "PLATFORM_ADMIN") {
  await page.addInitScript(({ seededRole, seededTenant }) => {
    const now = new Date().toISOString();
    localStorage.setItem("fams_access_token", "employee-e2e-access");
    localStorage.setItem("fams_refresh_token", "employee-e2e-refresh");
    localStorage.setItem(
      "fams_user",
      JSON.stringify({
        id: "user-e2e",
        email: "admin@fams.test",
        displayName: "Admin E2E",
        emailVerified: true,
        active: true,
        createdAt: now,
        updatedAt: now,
        role: seededRole,
        tenantId: seededTenant,
        permissions:
          seededRole === "TENANT_ADMIN"
            ? ["employees:create", "employees:read", "employees:update", "employees:list", "roles:read"]
            : [],
        memberships:
          seededTenant
            ? [{
                id: "membership",
                userId: "user-e2e",
                roleId: "tenant-admin-role",
                tenantId: seededTenant,
                siteIds: [],
              }]
            : [],
      }),
    );
  }, { seededRole: role, seededTenant: role === "TENANT_ADMIN" ? tenantId : null });
}

const employee = {
  id: employeeId,
  tenantId,
  userId: null,
  firstName: "An",
  lastName: "Nguyễn",
  fullName: "Nguyễn An",
  email: "an@example.com",
  employeeCode: "NV001",
  department: "Vận hành",
  position: "Kỹ sư",
  status: "active",
  createdAt: "2026-07-25T01:00:00Z",
  updatedAt: "2026-07-25T01:00:00Z",
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

test("HR phân biệt tạo hồ sơ, mời tài khoản, import và export theo filter", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN");
  let listParams: Record<string, string> = {};
  let inviteBody: Record<string, unknown> = {};
  let createBody: Record<string, unknown> = {};
  let exportParams: Record<string, string> = {};

  await page.route(`**/api/v1/tenants/${tenantId}/employees?*`, (route) => {
    listParams = Object.fromEntries(new URL(route.request().url()).searchParams);
    return route.fulfill({ json: api(pageData([employee])) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/employees`, async (route) => {
    createBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 201, json: api({ ...employee, ...createBody }) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/employees/export?*`, (route) => {
    exportParams = Object.fromEntries(new URL(route.request().url()).searchParams);
    return route.fulfill({
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: "excel",
    });
  });
  await page.route("**/api/v1/roles?*", (route) =>
    route.fulfill({
      json: api(pageData([{
        id: roleId,
        name: "EMPLOYEE",
        tenantId: null,
        isSystem: true,
        isActive: true,
      }])),
    }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/invitations`, async (route) => {
    inviteBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({
      status: 201,
      json: api({ id: invitationId, ...inviteBody, status: "pending", token: "only-on-create" }),
    });
  });

  await page.goto("/customer/employees");
  await expect(page.getByRole("button", { name: "Thêm hồ sơ (chưa cần đăng nhập)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mời tham gia (gửi email)" })).toBeVisible();

  await page.getByRole("button", { name: "Thêm hồ sơ (chưa cần đăng nhập)" }).click();
  await expect(page.getByText(/chỉ tạo hồ sơ nhân sự/)).toBeVisible();
  await page.getByRole("dialog").getByRole("textbox", { name: "Tên *", exact: true }).fill("Bình");
  await page.getByRole("dialog").getByRole("textbox", { name: "Họ và tên đệm *", exact: true }).fill("Trần");
  await page.getByRole("dialog").getByRole("button", { name: "Tạo mới" }).click();
  await expect.poll(() => createBody).toMatchObject({ firstName: "Bình", lastName: "Trần" });
  expect(createBody).not.toHaveProperty("password");

  await page.getByRole("button", { name: "Mời tham gia (gửi email)" }).click();
  await page.locator("#invite-email").fill("new.employee@example.com");
  await page.getByRole("button", { name: "Gửi lời mời" }).click();
  await expect.poll(() => inviteBody).toMatchObject({ email: "new.employee@example.com" });

  await page.getByLabel("Lọc nhân viên theo trạng thái").click();
  await page.getByText("Tạm nghỉ", { exact: true }).click();
  await expect(page).toHaveURL(/status=inactive/);
  await page.getByLabel("Lọc nhân viên theo phòng ban").fill("Vận hành");
  await expect.poll(() => listParams).toMatchObject({ status: "inactive", department: "Vận hành" });

  await page.getByRole("button", { name: "Xuất Excel" }).click();
  await expect.poll(() => exportParams).toMatchObject({ status: "inactive", department: "Vận hành" });

  await page.getByRole("button", { name: "Nhập Excel" }).click();
  await expect(page.getByText(/Import chỉ tạo hồ sơ nhân sự/)).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/01-company-employee-flows.png`, fullPage: true });
});

test("HR được cảnh báo hủy Random Check và rà soát phân công khi cho nghỉ việc", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN");
  let changedStatus: Record<string, unknown> | undefined;
  await page.route(`**/api/v1/tenants/${tenantId}/employees?*`, (route) =>
    route.fulfill({ json: api(pageData([employee])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/employees/${employeeId}/status`, async (route) => {
    changedStatus = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: api({ ...employee, status: changedStatus.status }) });
  });

  await page.goto("/customer/employees");
  await page.getByText("Hoạt động", { exact: true }).click();
  await page.getByText("Đánh dấu Đã nghỉ việc", { exact: true }).click();

  const confirm = page.getByRole("dialog", { name: /Chuyển sang.*Đã nghỉ việc/ });
  await expect(confirm.getByText(/Random Check đang chờ hoặc đã gửi chưa phản hồi sẽ tự động bị hủy/)).toBeVisible();
  await expect(confirm.getByText(/các phân công hiện có không tự kết thúc/)).toBeVisible();
  await confirm.getByRole("button", { name: "Xác nhận" }).click();
  await expect.poll(() => changedStatus).toEqual({ status: "terminated" });
  await expect(page).toHaveURL(/\/customer\/employees(?:\?|$)/);
  await expect(page).not.toHaveURL(new RegExp(`/customer/employees/${employeeId}`));
  await expect(page.getByText("Cập nhật trạng thái thành công")).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/06-status-change-stays-on-list.png`, fullPage: true });
});

test("Chi tiết HR hiển thị workspace, assignment, role và Face ID thật", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN");
  await page.route(`**/api/v1/tenants/${tenantId}/employees/${employeeId}`, (route) =>
    route.fulfill({
      json: api({
        ...employee,
        roles: [{ id: "assignment-role", roleId, roleName: "EMPLOYEE", tenantId, userId: "user" }],
        workspaces: [{
          id: "workspace-member",
          workspaceId: "workspace",
          workspaceName: "Đội thi công A",
          role: "member",
          assignedAt: "2026-07-20T01:00:00Z",
        }],
        assignments: [{
          id: "site-assignment",
          tenantId,
          siteId: "site-a",
          employeeId,
          siteSummary: {
            id: "site-a",
            name: "Công trình Tây Hồ",
            code: "AP-TH",
            address: "Tây Hồ, Hà Nội",
            timezone: "Asia/Ho_Chi_Minh",
          },
          shiftSummary: {
            id: "shift-afternoon",
            name: "Ca chiều",
            startTime: "13:00:00",
            endTime: "21:00:00",
            status: "active",
          },
          startDate: "2026-07-01",
          endDate: null,
          daysOfWeek: ["MONDAY", "FRIDAY"],
          role: "worker",
          status: "active",
          createdAt: "2026-07-01T01:00:00Z",
          updatedAt: "2026-07-01T01:00:00Z",
        }],
      }),
    }),
  );

  await page.goto(`/customer/employees/${employeeId}`);
  await page.getByRole("tab", { name: /Workspace & Phân công/ }).click();
  await expect(page.getByText("Đội thi công A")).toBeVisible();
  await expect(page.getByText("Công trình Tây Hồ")).toBeVisible();
  await expect(page.getByText("Mã công trình: AP-TH")).toBeVisible();
  await expect(page.getByText("Tây Hồ, Hà Nội")).toBeVisible();
  await expect(page.getByText("Ca: Ca chiều")).toBeVisible();
  await expect(page.getByText("13:00 – 21:00")).toBeVisible();
  await expect(page.getByText("site-a")).toHaveCount(0);
  await expect(page.getByText("Lịch: T2, T6")).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/02-employee-detail.png`, fullPage: true });
  await page.getByRole("tab", { name: /Sinh trắc học/ }).click();
  await expect(page.getByText(/Đã đăng ký/).first()).toBeVisible();
});

test("HR tải mẫu, kiểm tra lỗi theo trường rồi mới được xác nhận import", async ({ page }) => {
  await seedUser(page, "TENANT_ADMIN");
  let validationCalls = 0;
  let importCalls = 0;

  await page.route(`**/api/v1/tenants/${tenantId}/employees?*`, (route) =>
    route.fulfill({ json: api(pageData([employee])) }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/employees/import/template`, (route) =>
    route.fulfill({
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      headers: { "Content-Disposition": "attachment; filename=mau-import-nhan-vien.xlsx" },
      body: "excel-template",
    }),
  );
  await page.route(`**/api/v1/tenants/${tenantId}/employees/import/validate`, (route) => {
    validationCalls++;
    return route.fulfill({
      json: api(validationCalls === 1
        ? {
            valid: false,
            totalRows: 2,
            validRows: 1,
            invalidRows: 1,
            errors: [{ row: 3, field: "email", message: "Email không đúng định dạng" }],
          }
        : {
            valid: true,
            totalRows: 2,
            validRows: 2,
            invalidRows: 0,
            errors: [],
          }),
    });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/employees/import`, (route) => {
    importCalls++;
    return route.fulfill({
      json: api({ totalRows: 2, successCount: 2, failedCount: 0, errors: [] }),
    });
  });

  await page.goto("/customer/employees");
  await page.getByRole("button", { name: "Nhập Excel" }).click();
  const dialog = page.getByRole("dialog", { name: "Import danh sách nhân viên" });
  await expect(dialog.getByText("Bước 1 — Tải file Excel mẫu tiếng Việt")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Tải file mẫu" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("mau-import-nhan-vien.xlsx");

  await dialog.locator('input[type="file"]').setInputFiles({
    name: "nhan-vien.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from("mock-xlsx"),
  });
  await expect(dialog.getByRole("button", { name: "Xác nhận import" })).toBeDisabled();

  await dialog.getByRole("button", { name: "Kiểm tra dữ liệu" }).click();
  await expect(dialog.getByText("Email không đúng định dạng")).toBeVisible();
  await expect(dialog.getByText("Email", { exact: true })).toBeVisible();
  await expect(dialog.getByText("1/2 dòng cần sửa")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Xác nhận import" })).toBeDisabled();
  await dialog.getByText("Email không đúng định dạng").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${evidenceDir}/04-import-validation.png`, fullPage: true });

  await dialog.locator('input[type="file"]').setInputFiles({
    name: "nhan-vien-da-sua.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from("fixed-mock-xlsx"),
  });
  await expect(dialog.getByText("Email không đúng định dạng")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Xác nhận import" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Kiểm tra dữ liệu" }).click();
  await expect(dialog.getByText("2/2 dòng hợp lệ — có thể import")).toBeVisible();
  await dialog.getByRole("button", { name: "Xác nhận import" }).click();
  await expect(dialog.getByText("Hoàn tất: đã tạo 2 hồ sơ nhân viên")).toBeVisible();
  expect(validationCalls).toBe(2);
  expect(importCalls).toBe(1);
  await page.screenshot({ path: `${evidenceDir}/05-import-success.png`, fullPage: true });
});

test("Platform Admin gửi và hủy lời mời nền tảng trên màn riêng", async ({ page }) => {
  await seedUser(page, "PLATFORM_ADMIN");
  let sentBody: Record<string, unknown> = {};
  let cancelledId = "";

  await page.route("**/api/v1/users?*", (route) => route.fulfill({ json: api(pageData([])) }));
  await page.route("**/api/v1/roles?*", (route) =>
    route.fulfill({
      json: api(pageData([{
        id: roleId,
        name: "PLATFORM_STAFF",
        tenantId: null,
        isSystem: true,
        isActive: true,
      }])),
    }),
  );
  await page.route("**/api/v1/platform/invitations?*", (route) =>
    route.fulfill({
      json: api(pageData([{
        id: invitationId,
        email: "pending@fams.vn",
        status: "pending",
        invitedBy: "admin",
        roleId,
        createdAt: "2026-07-25T01:00:00Z",
        updatedAt: "2026-07-25T01:00:00Z",
        expiresAt: "2026-08-01T01:00:00Z",
        token: null,
      }])),
    }),
  );
  await page.route("**/api/v1/platform/invitations", async (route) => {
    sentBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 201, json: api({ id: "new", ...sentBody, status: "pending" }) });
  });
  await page.route("**/api/v1/platform/invitations/*", async (route) => {
    cancelledId = route.request().url().split("/").pop() ?? "";
    return route.fulfill({ json: api({ id: cancelledId, status: "cancelled", token: null }) });
  });

  await page.goto("/admin/users");
  await page.getByRole("tab", { name: /Lời mời nền tảng/ }).click();
  await expect(page.getByText("pending@fams.vn")).toBeVisible();
  await expect(page.getByText(/không phải nhân viên của một công ty/)).toBeVisible();

  await page.getByRole("button", { name: "Mời nhân sự nền tảng" }).click();
  await page.getByRole("dialog").getByLabel("Email").fill("new.staff@fams.vn");
  await page.getByRole("dialog").getByRole("button", { name: "Gửi lời mời" }).click();
  await expect.poll(() => sentBody).toMatchObject({ email: "new.staff@fams.vn" });

  await page.getByLabel("Lời mời nền tảng").getByRole("button", { name: "Hủy" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Hủy lời mời" }).click();
  await expect.poll(() => cancelledId).toBe(invitationId);
  await page.screenshot({ path: `${evidenceDir}/03-platform-invitations.png`, fullPage: true });
});

test("Link lời mời công ty và nền tảng dùng đúng validate/accept endpoint", async ({ page }) => {
  for (const type of ["tenant", "platform"] as const) {
    const prefix = type === "platform" ? "/platform-invitations" : "/invitations";
    let accepted: Record<string, unknown> = {};
    await page.route(`**/api/v1${prefix}/validate?*`, (route) =>
      route.fulfill({
        json: api({
          email: `${type}@example.com`,
          tenantName: type === "tenant" ? "Công ty Demo" : undefined,
          isExistingUser: true,
        }),
      }),
    );
    await page.route(`**/api/v1${prefix}/accept`, async (route) => {
      accepted = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: api({}) });
    });

    await page.goto(`/accept-invite?type=${type}&token=${type}-token`);
    await expect(page.getByText(`${type}@example.com`)).toBeVisible();
    await expect(page.getByRole("link", { name: "Mở lời mời trong ứng dụng FAMS" }))
      .toHaveAttribute("href", `famsfrontappproject://accept-invite?type=${type}&token=${type}-token`);
    await page.getByRole("button", { name: "Chấp nhận lời mời" }).click();
    await expect.poll(() => accepted).toEqual({ token: `${type}-token` });
    await page.unroute(`**/api/v1${prefix}/validate?*`);
    await page.unroute(`**/api/v1${prefix}/accept`);
  }
});
