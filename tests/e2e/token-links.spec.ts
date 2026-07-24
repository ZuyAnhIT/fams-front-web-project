import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("link xác thực đăng ký hiển thị UI và chỉ dùng token một lần", async ({ page }) => {
  let verifyCalls = 0;
  await page.route("**/api/auth/verify-email?token=registration-token", async (route) => {
    verifyCalls += 1;
    await route.fulfill({ json: { success: true, message: "Verified", data: null } });
  });

  await page.goto("/verify-email?token=registration-token");
  await expect(page.getByRole("heading", { name: "Xác thực thành công" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mở ứng dụng FAMS" })).toHaveAttribute("href", "famsfrontappproject://login");
  await expect(page.getByRole("link", { name: "Đăng nhập trên web" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("button", { name: "Quay lại trang trước" })).toBeVisible();
  expect(verifyCalls).toBe(1);
});

test("link đổi email cũ được proxy về giao diện và gọi đúng mode", async ({ page }) => {
  let requestedUrl = "";
  await page.route("**/api/auth/verify-email?token=email-change-token&mode=email-change", async (route) => {
    requestedUrl = route.request().url();
    await route.fulfill({ json: { success: true, message: "Email changed", data: null } });
  });

  await page.goto("/api/v1/auth/profile/email/confirm-change?token=email-change-token");
  await expect(page).toHaveURL(/\/verify-email\?token=email-change-token&mode=email-change$/);
  await expect(page.getByRole("heading", { name: "Xác thực thành công" })).toBeVisible();
  await expect(page.getByText("Email mới đã được xác thực và cập nhật")).toBeVisible();
  await expect(page.getByRole("link", { name: "Mở cài đặt trên web" })).toHaveAttribute("href", "/customer/settings");
  expect(requestedUrl).toContain("mode=email-change");
});

test("link quên mật khẩu hiển thị form và gửi đúng token", async ({ page }) => {
  let resetBody: Record<string, unknown> = {};
  await page.route("**/api/v1/auth/reset-password", async (route) => {
    resetBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { success: true, message: "Password reset", data: null } });
  });

  await page.goto("/reset-password?token=reset-token");
  await expect(page.getByRole("heading", { name: "Tạo mật khẩu mới" })).toBeVisible();
  await page.locator("#reset-new-password").fill("NewPassword1");
  await page.locator("#reset-confirm-password").fill("NewPassword1");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();

  await expect(page.getByRole("heading", { name: "Đổi mật khẩu thành công!" })).toBeVisible();
  expect(resetBody).toEqual({ token: "reset-token", newPassword: "NewPassword1" });
  await expect(page.getByRole("link", { name: "Mở ứng dụng FAMS" })).toHaveAttribute("href", "famsfrontappproject://login");
  await expect(page.getByRole("link", { name: "Đăng nhập trên web" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("button", { name: "Quay lại trang trước" })).toBeVisible();
});

test("lỗi mạng không còn loading vô hạn và cho phép thử lại", async ({ page }) => {
  await page.route("**/api/auth/verify-email?token=network-error", (route) => route.abort("failed"));

  await page.goto("/verify-email?token=network-error");
  await expect(page.getByRole("heading", { name: "Không thể xác thực" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quay lại trang trước" })).toBeVisible();
});
