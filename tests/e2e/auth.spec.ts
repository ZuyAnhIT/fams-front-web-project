import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const evidenceDir = "docs/test-evidence/auth";
const runId = `${Date.now()}`;
const phone = `+8494${runId.slice(-7)}`;
const email = `frontend.auth.${runId}@example.com`;
const password = "TestPass1";

function readLatestPhoneOtp(targetPhone: string): string {
  const sql = `SELECT otp_code FROM phone_otps WHERE phone='${targetPhone}' ORDER BY created_at DESC LIMIT 1;`;
  return execFileSync(
    "docker",
    ["exec", "fams-postgres", "psql", "-U", "fams_user", "-d", "fams_db", "-tAc", sql],
    { encoding: "utf8" },
  ).trim();
}

function findEmailVerificationToken(userId: string): string {
  const redisPassword = execFileSync("docker", ["exec", "fams-api", "printenv", "REDIS_PASSWORD"], { encoding: "utf8" }).trim();
  const redis = (...command: string[]) => execFileSync(
    "docker",
    ["exec", "fams-redis", "redis-cli", "-a", redisPassword, "--no-auth-warning", ...command],
    { encoding: "utf8" },
  ).trim();

  const keys = redis("--scan", "--pattern", "email:verify:*").split("\n").filter((key) => key && !key.includes(":resend:rate:"));
  for (const key of keys) {
    if (redis("GET", key) === userId) return key.replace("email:verify:", "");
  }
  throw new Error(`Không tìm thấy verification token cho user ${userId}`);
}

async function fillRegistration(page: Page, identifier: string) {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Đăng ký" })).toBeVisible();
  // Chờ hydration ổn định; nếu nhập ngay khi HTML vừa hiện, React Hook Form có thể
  // áp defaultValues sau đó và reset thao tác automation.
  await page.waitForTimeout(750);
  await page.locator("#register-fullname").fill("Frontend Auth Test");
  await page.locator("#register-email-phone").fill(identifier);
  await page.locator("#register-password").fill(password);
  await page.locator("#register-confirmpassword").fill(password);
  await expect(page.locator("#register-email-phone")).toHaveValue(identifier);
}

async function loginWithPassword(page: Page, identifier: string) {
  await page.goto(`/login?identifier=${encodeURIComponent(identifier)}`);
  await expect(page.locator("#login-identifier")).toHaveValue(identifier);
  await page.locator("#login-password").fill(password);
  const loginRequest = page.waitForRequest((request) => request.url().includes("/api/v1/auth/login") && request.method() === "POST");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const request = await loginRequest;
  const body = request.postDataJSON() as { identifier: string; deviceId: string };
  expect(body.identifier).toBe(identifier);
  expect(body.deviceId).toMatch(/^web-/);
  await expect(page).toHaveURL(/\/customer\/select-company$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Chọn công ty làm việc" })).toBeVisible();
}

async function seedAuthenticatedPage(page: Page, overrides: Record<string, unknown> = {}) {
  await page.addInitScript(({ userOverrides }) => {
    const user = {
      id: "settings-user",
      email: "settings@example.com",
      emailVerified: true,
      phone: "+84912345678",
      phoneVerified: true,
      displayName: "Settings User",
      avatarUrl: "http://localhost:9000/fams-avatars/e2e-avatar.png",
      dateOfBirth: null,
      hometown: null,
      gender: null,
      address: null,
      googleLinked: false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userOverrides,
    };
    localStorage.setItem("fams_access_token", "access-settings-e2e");
    localStorage.setItem("fams_refresh_token", "refresh-settings-e2e");
    localStorage.setItem("fams_user", JSON.stringify(user));
  }, { userOverrides: overrides });
}

test.beforeAll(() => {
  mkdirSync(evidenceDir, { recursive: true });
});

test("đăng ký số điện thoại qua OTP backend và đăng nhập bằng mật khẩu", async ({ page }) => {
  await fillRegistration(page, phone);

  const sendOtpResponse = page.waitForResponse((response) => response.url().includes("/api/v1/auth/register/send-otp") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  expect((await sendOtpResponse).status()).toBe(200);
  await expect(page.getByText("Mã hết hạn sau")).toBeVisible();

  const otp = readLatestPhoneOtp(phone);
  expect(otp).toMatch(/^\d{6}$/);
  const otpInputs = page.locator(".ant-otp input");
  for (let index = 0; index < otp.length; index += 1) {
    await otpInputs.nth(index).fill(otp[index]);
  }

  const registerRequest = page.waitForRequest((request) => request.url().endsWith("/api/v1/auth/register") && request.method() === "POST");
  await page.getByRole("button", { name: "Xác nhận và đăng ký" }).click();
  const body = (await registerRequest).postDataJSON() as Record<string, unknown>;
  expect(body).toMatchObject({ phone, password, otpCode: otp, displayName: "Frontend Auth Test" });
  expect(body).not.toHaveProperty("email");
  expect(body).not.toHaveProperty("firebaseIdToken");
  await expect(page).toHaveURL(new RegExp(`/login\\?identifier=${encodeURIComponent(phone).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  await page.screenshot({ path: `${evidenceDir}/01-phone-register-success.png`, fullPage: true });

  await loginWithPassword(page, phone);
  await page.screenshot({ path: `${evidenceDir}/02-phone-login-success.png`, fullPage: true });
});

test("đăng ký email, gửi lại, mở link xác thực và đăng nhập", async ({ page }) => {
  await fillRegistration(page, email);
  const registerResponsePromise = page.waitForResponse((response) => response.url().endsWith("/api/v1/auth/register") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  const registerResponse = await registerResponsePromise;
  expect(registerResponse.status()).toBe(201);
  const responseBody = await registerResponse.json() as { data: { userId: string } };
  await expect(page.getByRole("heading", { name: "Kiểm tra email" })).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/03-email-waiting-verification.png`, fullPage: true });

  const resendResponse = page.waitForResponse((response) => response.url().includes("/api/v1/auth/resend-verification") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Gửi lại email xác thực" }).click();
  expect((await resendResponse).status()).toBe(200);

  const verificationToken = findEmailVerificationToken(responseBody.data.userId);
  await page.goto(`/api/v1/auth/verify-email?token=${encodeURIComponent(verificationToken)}`);
  await expect(page).toHaveURL(/\/verify-email\?token=/);
  await expect(page.getByRole("heading", { name: "Xác thực thành công" })).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/04-email-verify-success.png`, fullPage: true });

  await loginWithPassword(page, email);
  await page.screenshot({ path: `${evidenceDir}/05-email-login-success.png`, fullPage: true });
});

test("login email chưa xác thực hiển thị CTA gửi lại", async ({ page }) => {
  const pendingEmail = `pending.${runId}@example.com`;
  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      status: 403,
      json: {
        success: false,
        message: "Email is not verified",
        userMessage: "Email chưa được xác thực.",
        errorCode: "EMAIL_NOT_VERIFIED",
        data: null,
      },
    });
  });
  await page.route("**/api/v1/auth/resend-verification", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ email: pendingEmail });
    await route.fulfill({ json: { success: true, message: "Accepted", data: null } });
  });

  await page.goto("/login");
  await page.locator("#login-identifier").fill(pendingEmail);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const resendButton = page.getByRole("button", { name: "Gửi lại email xác thực" });
  await expect(resendButton).toBeVisible();
  const resendResponse = page.waitForResponse((response) => response.url().includes("/api/v1/auth/resend-verification"));
  await resendButton.click();
  expect((await resendResponse).status()).toBe(200);
});

test("Google credential được đổi sang session FAMS và /me xác nhận googleLinked", async ({ page }) => {
  const payload = Buffer.from(JSON.stringify({ isPlatformAdmin: false }), "utf8").toString("base64url");
  const accessToken = `eyJhbGciOiJub25lIn0.${payload}.signature`;
  let googleRequestBody: { idToken?: string; deviceId?: string } = {};

  await page.route("https://accounts.google.com/gsi/client", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `window.google={accounts:{id:{initialize:function(o){window.__famsGoogleCallback=o.callback},renderButton:function(el){var b=document.createElement('button');b.textContent='Tiếp tục với Google';b.onclick=function(){window.__famsGoogleCallback({credential:'google-id-token-e2e'})};el.appendChild(b)},prompt:function(){},cancel:function(){}}}};`,
    });
  });
  await page.route("**/api/v1/auth/login/google", async (route) => {
    googleRequestBody = route.request().postDataJSON() as typeof googleRequestBody;
    await route.fulfill({ json: { success: true, message: "Success", data: { accessToken, refreshToken: "refresh-e2e", tokenType: "Bearer", expiresIn: 900, totpRequired: false } } });
  });
  await page.route("**/api/v1/auth/me", async (route) => {
    await route.fulfill({ json: { success: true, message: "Success", data: { id: "google-user", email: "google@example.com", phone: null, displayName: "Google Test", avatarUrl: null, googleLinked: true, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } } });
  });
  await page.route("**/api/v1/roles/me", async (route) => {
    await route.fulfill({ json: { success: true, message: "Success", data: [] } });
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "Tiếp tục với Google" }).click();
  await expect(page).toHaveURL(/\/customer\/select-company$/);
  await expect(page.getByRole("heading", { name: "Chọn công ty làm việc" })).toBeVisible();
  expect(googleRequestBody.idToken).toBe("google-id-token-e2e");
  expect(googleRequestBody.deviceId).toMatch(/^web-/);
  const storedUser = await page.evaluate(() => JSON.parse(localStorage.getItem("fams_user") || "null") as { googleLinked?: boolean });
  expect(storedUser.googleLinked).toBe(true);
  await page.screenshot({ path: `${evidenceDir}/06-google-session-success.png`, fullPage: true });
});

test("đặt lại và đổi mật khẩu chỉ gửi field backend hỗ trợ, sau đó xóa phiên local", async ({ page }) => {
  let resetBody: Record<string, unknown> = {};
  await page.route("**/api/v1/auth/reset-password", async (route) => {
    resetBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { success: true, message: "Password has been reset successfully.", data: null } });
  });
  await page.goto("/reset-password?token=reset-token-e2e");
  await page.locator("#reset-new-password").fill("NewPassword1");
  await page.locator("#reset-confirm-password").fill("NewPassword1");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await expect(page.getByRole("heading", { name: "Đổi mật khẩu thành công!" })).toBeVisible();
  expect(resetBody).toEqual({ token: "reset-token-e2e", newPassword: "NewPassword1" });

  await seedAuthenticatedPage(page);
  let changeBody: Record<string, unknown> = {};
  await page.route("**/api/v1/auth/change-password", async (route) => {
    changeBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { success: true, message: "Success", data: null } });
  });
  await page.goto("/customer/settings/password");
  await page.locator("#change-current-password").fill("TestPass1");
  await page.locator("#change-new-password").fill("NewPassword1");
  await page.locator("#change-confirm-password").fill("NewPassword1");
  await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(changeBody).toEqual({ currentPassword: "TestPass1", newPassword: "NewPassword1" });
  expect(await page.evaluate(() => localStorage.getItem("fams_access_token"))).toBeNull();
  await page.screenshot({ path: `${evidenceDir}/07-password-session-revoked.png`, fullPage: true });
});

test("hồ sơ dùng API xác thực riêng cho email/phone/avatar và liên kết Google", async ({ page }) => {
  await seedAuthenticatedPage(page);
  const profile = {
    id: "settings-user", email: "settings@example.com", emailVerified: true,
    phone: "+84987654321", phoneVerified: true, displayName: "Settings Updated",
    avatarUrl: "http://localhost:9000/fams-avatars/e2e-avatar.png", dateOfBirth: null, hometown: null, gender: null, address: null,
    googleLinked: false, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  let profilePatch: Record<string, unknown> = {};
  let emailBody: Record<string, unknown> = {};
  let phoneRequestBody: Record<string, unknown> = {};
  let phoneConfirmBody: Record<string, unknown> = {};
  let linkedToken = "";
  let avatarDeleted = false;

  await page.route("https://accounts.google.com/gsi/client", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `window.google={accounts:{id:{initialize:function(o){window.__famsGoogleCallback=o.callback},renderButton:function(el){var b=document.createElement('button');b.textContent='Tiếp tục với Google';b.onclick=function(){window.__famsGoogleCallback({credential:'google-link-token-e2e'})};el.appendChild(b)},prompt:function(){},cancel:function(){}}}};`,
    });
  });
  await page.route("**/api/v1/auth/me", async (route) => {
    if (route.request().method() === "PATCH") profilePatch = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { success: true, message: "Success", data: profile } });
  });
  await page.route("**/api/v1/auth/profile/email/request-change", async (route) => {
    emailBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { success: true, message: "Sent", data: null } });
  });
  await page.route("**/api/v1/auth/profile/phone/request-change", async (route) => {
    phoneRequestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { success: true, message: "Sent", data: null } });
  });
  await page.route("**/api/v1/auth/profile/phone/confirm-change", async (route) => {
    phoneConfirmBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { success: true, message: "Success", data: profile } });
  });
  await page.route("**/api/v1/auth/profile/avatar", async (route) => {
    if (route.request().method() === "DELETE") avatarDeleted = true;
    await route.fulfill({ json: { success: true, message: "Success", data: { ...profile, avatarUrl: null } } });
  });
  await page.route("**/api/v1/auth/link-google", async (route) => {
    linkedToken = (route.request().postDataJSON() as { idToken: string }).idToken;
    await route.fulfill({ json: { success: true, message: "Success", data: null } });
  });

  await page.goto("/customer/settings");
  await page.locator("#profile-display-name").fill("Settings Updated");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect.poll(() => Object.keys(profilePatch).length).toBeGreaterThan(0);
  expect(profilePatch).not.toHaveProperty("phone");
  expect(profilePatch).not.toHaveProperty("email");
  expect(profilePatch).not.toHaveProperty("avatarUrl");

  await page.locator("#profile-email").fill("new-settings@example.com");
  await page.getByRole("button", { name: "Đổi email" }).click();
  expect(emailBody).toEqual({ email: "new-settings@example.com" });

  await page.locator("#profile-phone").fill("+84987654321");
  await page.getByRole("button", { name: "Đổi số" }).click();
  expect(phoneRequestBody).toEqual({ phone: "+84987654321" });
  const phoneOtpInputs = page.locator(".ant-otp input");
  for (const [index, digit] of [..."123456"].entries()) await phoneOtpInputs.nth(index).fill(digit);
  await page.getByRole("button", { name: "Xác nhận OTP" }).click();
  expect(phoneConfirmBody).toEqual({ phone: "+84987654321", otpCode: "123456" });

  await page.getByRole("button", { name: "Xóa ảnh đại diện" }).click();
  await expect.poll(() => avatarDeleted).toBe(true);
  await page.getByRole("button", { name: "Tiếp tục với Google" }).click();
  await expect.poll(() => linkedToken).toBe("google-link-token-e2e");
  await page.screenshot({ path: `${evidenceDir}/08-profile-security-methods.png`, fullPage: true });
});

test("link đổi email mở đúng trang kết quả và danh sách phiên cho phép thu hồi chọn lọc", async ({ page }) => {
  await page.route("**/api/auth/verify-email?*", async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get("mode")).toBe("email-change");
    expect(url.searchParams.get("token")).toBe("change-token-e2e");
    await route.fulfill({ json: { success: true, message: "Email changed", data: null } });
  });
  await page.goto("/api/v1/auth/profile/email/confirm-change?token=change-token-e2e");
  await expect(page).toHaveURL(/\/verify-email\?token=change-token-e2e&mode=email-change$/);
  await expect(page.getByText("Email mới đã được xác thực và cập nhật.")).toBeVisible();

  await seedAuthenticatedPage(page, { avatarUrl: null, googleLinked: true });
  let sessionDeleted = "";
  let loggedOutOthers = false;
  await page.route("**/api/v1/auth/sessions", async (route) => {
    await route.fulfill({ json: { success: true, message: "Success", data: [
      { id: "current-session", deviceId: "web-chrome-linux-current", userAgent: "Mozilla/5.0 (X11; Linux) Chrome/140", ipAddress: "127.0.0.1", createdAt: new Date().toISOString(), lastUsedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), current: true },
      ...(!sessionDeleted ? [{ id: "old-session", deviceId: "iphone-15-test", userAgent: "Mozilla/5.0 (iPhone)", ipAddress: "127.0.0.2", createdAt: new Date().toISOString(), lastUsedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), current: false }] : []),
    ] } });
  });
  await page.route("**/api/v1/auth/sessions/*", async (route) => {
    sessionDeleted = route.request().url().split("/").pop() || "";
    await route.fulfill({ json: { success: true, message: "Success", data: null } });
  });
  await page.route("**/api/v1/auth/logout/others", async (route) => {
    loggedOutOthers = true;
    await route.fulfill({ json: { success: true, message: "Success", data: null } });
  });

  await page.goto("/customer/settings/sessions");
  await expect(page.getByText("Thiết bị này", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.getByRole("button", { name: "Thu hồi phiên" }).click();
  await expect.poll(() => sessionDeleted).toBe("old-session");
  await page.getByRole("button", { name: "Các thiết bị khác" }).click();
  await page.getByRole("button", { name: "Đăng xuất nơi khác" }).click();
  await expect.poll(() => loggedOutOthers).toBe(true);
  await expect(page.getByText("Đăng xuất các thiết bị khác?", { exact: true })).not.toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/09-session-management.png`, fullPage: true });
});
