import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const evidenceDir = "docs/test-evidence/management-analytics";
const tenantId = "11111111-1111-4111-8111-111111111111";
const siteId = "22222222-2222-4222-8222-222222222222";
const planId = "33333333-3333-4333-8333-333333333333";
const workspaceId = "44444444-4444-4444-8444-444444444444";
const shiftId = "55555555-5555-4555-8555-555555555555";
const employeeId = "66666666-6666-4666-8666-666666666666";
const api = (data: unknown) => ({ success: true, message: "Success", data });
const pageData = (content: unknown[]) => ({ content, page: 0, size: 100, totalElements: content.length, totalPages: 1, first: true, last: true });

async function seedUser(page: Page, platform: boolean) {
  await page.addInitScript(({ isPlatform, seededTenant }) => {
    localStorage.setItem("fams_access_token", "analytics-e2e-access");
    localStorage.setItem("fams_refresh_token", "analytics-e2e-refresh");
    localStorage.setItem("fams_user", JSON.stringify({
      id: "analytics-user", email: "analytics@fams.test", displayName: isPlatform ? "Platform Admin" : "HR An Phát",
      emailVerified: true, active: true, role: isPlatform ? "PLATFORM_ADMIN" : "HR_MANAGER",
      tenantId: isPlatform ? null : seededTenant,
      permissions: isPlatform ? [] : ["employees:list", "sites:list", "workspaces:list", "shifts:list", "reports:list", "checkins:list"],
      memberships: isPlatform ? [] : [{ id: "membership", tenantId: seededTenant, siteIds: [] }],
    }));
  }, { isPlatform: platform, seededTenant: tenantId });
}

const revenue = {
  from: "2025-10-01", to: "2026-09-06",
  kpis: { collectedRevenue: 920000, currentMrr: 135000, trialConversionRate: 42.5, renewalRate: 78, churnRate: 8.5, averageRevenuePerCompany: 306666, paymentSuccessRate: 91.2 },
  subscriptionStatus: { TRIAL: 2, ACTIVE: 8, EXPIRED: 1, CANCELLED: 1 },
  paymentStatus: { PAID: 12, FAILED: 1 },
  trend: [{ period: "2026-07", collectedRevenue: 210000, mrr: 105000 }, { period: "2026-08", collectedRevenue: 300000, mrr: 120000 }, { period: "2026-09", collectedRevenue: 410000, mrr: 135000 }],
  byPlan: [{ planId: "plan-1", planName: "Doanh nghiệp", collectedRevenue: 600000, paidOrders: 6, activeSubscriptions: 4, revenueShare: 65.2 }],
  funnel: { trial: 12, paid: 8, activated: 8, renewed: 5 },
  expiringSubscriptions: [{ tenantId, tenantName: "Công ty CP Xây dựng An Phát", planName: "Doanh nghiệp", billingCycle: "MONTHLY", expiresAt: "2026-09-12T00:00:00+07:00", daysRemaining: 6 }],
};

const health = {
  from: "2025-10-01", to: "2026-09-06",
  kpis: { totalTenants: 12, newTenants: 3, activeTenants: 10, suspendedTenants: 2, totalUsers: 180, activeUsers7d: 92, activeUsers30d: 130, employees: 150, sites: 24, checkins: 4200 },
  growth: [{ period: "2026-07", newTenants: 1, newUsers: 12 }, { period: "2026-08", newTenants: 2, newUsers: 30 }],
  moduleUsage: { checkins: 4200, faceId: 3500, randomChecks: 720, reports: 85 },
  inactivityBuckets: { "7-13 ngày": 1, "14-29 ngày": 1, "Từ 30 ngày": 1 },
  tenantsAtRisk: [{ tenantId, tenantName: "Công ty cần hỗ trợ", planName: "Khởi đầu", subscriptionStatus: "ACTIVE", healthScore: 45, riskLevel: "HIGH", maxPlanUsagePercent: 90, employees: 18, sites: 2, checkins30d: 0, randomChecks30d: 0, lastActivityAt: "2026-08-01T00:00:00+07:00", inactiveDays: 36, recommendedAction: "Liên hệ và rà soát khả năng gia hạn" }],
  tenantsNearPlanLimit: [{ tenantId: "tenant-2", tenantName: "Công ty gần giới hạn", planName: "Cơ bản", subscriptionStatus: "ACTIVE", healthScore: 82, riskLevel: "LOW", maxPlanUsagePercent: 95, employees: 48, sites: 4, checkins30d: 800, randomChecks30d: 100, lastActivityAt: "2026-09-06T00:00:00+07:00", inactiveDays: 0, recommendedAction: "Tư vấn nâng gói trước khi chạm giới hạn" }],
};

const workforce = {
  from: "2026-09-01", to: "2026-09-06",
  kpis: { assignedOccurrences: 74, presentOccurrences: 49, absentOccurrences: 25, attendanceRate: 66.2, absenceRate: 33.8, lateRate: 4.1, earlyLeaveRate: 2, missingCheckoutRate: 2, totalWorkMinutes: 25021, totalOtMinutes: 120, averageWorkMinutesPerEmployee: 511 },
  comparison: { attendanceRateChange: 3.2, lateRateChange: -1.1, absenceRateChange: -3.2, workMinutesChange: 8.4, otMinutesChange: 12 },
  dailyTrend: [{ date: "2026-09-01", assigned: 12, present: 10, absent: 2, late: 1, earlyLeave: 0, missingCheckout: 0, workMinutes: 4800, otMinutes: 30 }, { date: "2026-09-02", assigned: 12, present: 9, absent: 3, late: 0, earlyLeave: 1, missingCheckout: 1, workMinutes: 4300, otMinutes: 90 }],
  bySite: [{ siteId, siteName: "Công trình Tây Hồ", assigned: 24, present: 19, absent: 5, attendanceRate: 79.2, workMinutes: 9100, otMinutes: 120 }],
  shortageByWeekday: [{ isoDayOfWeek: 2, weekday: "Thứ 2", assigned: 24, absent: 5, absenceRate: 20.8 }],
};

const risk = {
  from: "2026-09-01", to: "2026-09-06",
  kpis: { violations: 8, checkins: 49, violationsPer100Checkins: 16.3, unresolved: 2, overdue: 1, averageResolutionHours: 7.5, medianResolutionHours: 4.2, acceptedExplanationRate: 50, randomCheckPassRate: 88, faceEnrollmentRate: 93, attendanceImpactViolations: 2 },
  byType: { location_fail: 4, face_fail: 2, no_response: 2 }, aging: { "Dưới 24 giờ": 1, "1-3 ngày": 0, "3-7 ngày": 1, "Trên 7 ngày": 0 },
  funnel: { detected: 8, explained: 5, reviewed: 4, confirmed: 2, dismissed: 2 },
  trend: [{ date: "2026-09-01", violationType: "location_fail", count: 2 }, { date: "2026-09-02", violationType: "face_fail", count: 1 }],
  siteRisk: [{ siteId, siteName: "Công trình Tây Hồ", violationType: "location_fail", count: 4, per100Checkins: 16.3 }],
  repeatOffenders: [{ employeeId: "employee-1", employeeName: "Nguyễn Văn A", employeeCode: "AP008", violations: 3, unresolved: 1 }],
};

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    if (route.request().url().includes("/notifications")) return route.fulfill({ json: api({ items: [], unreadCount: 0 }) });
    return route.fulfill({ json: api(null) });
  });
});

test("Platform Admin xem báo cáo doanh thu và sức khỏe khách hàng", async ({ page }) => {
  await seedUser(page, true);
  const revenueRequests: string[] = [];
  await page.route("**/api/v1/tenants?*", (route) => route.fulfill({ json: api(pageData([{ id: tenantId, name: "Công ty CP Xây dựng An Phát", slug: "an-phat", status: "active", timezone: "Asia/Ho_Chi_Minh", locale: "vi-VN", createdAt: "2026-09-01", updatedAt: "2026-09-01" }])) }));
  await page.route("**/api/v1/plans?*", (route) => route.fulfill({ json: api(pageData([{ id: planId, name: "business", displayName: "Doanh nghiệp", priceMonthly: 40000, priceYearly: 400000, isActive: true, sortOrder: 4, createdAt: "2026-09-01", updatedAt: "2026-09-01" }])) }));
  await page.route("**/api/v1/platform/reports/revenue?*", (route) => {
    revenueRequests.push(route.request().url());
    return route.fulfill({ json: api(revenue) });
  });
  await page.route("**/api/v1/platform/reports/customer-health?*", (route) => route.fulfill({ json: api(health) }));
  await page.goto("/admin/dashboard");
  await expect(page.getByText("Doanh thu thực thu", { exact: true })).toBeVisible();
  await expect(page.getByText("920.000 ₫")).toBeVisible();
  await expect(page.getByText("Công ty CP Xây dựng An Phát")).toBeVisible();
  const companyFilter = page.getByRole("combobox", { name: "Lọc báo cáo theo công ty" });
  await companyFilter.press("ArrowDown");
  await companyFilter.press("Enter");
  const planFilter = page.getByRole("combobox", { name: "Lọc báo cáo theo gói" });
  await planFilter.press("ArrowDown");
  await planFilter.press("Enter");
  const statusFilter = page.getByRole("combobox", { name: "Lọc báo cáo theo trạng thái thuê bao" });
  await statusFilter.press("ArrowDown");
  await statusFilter.press("ArrowDown");
  await statusFilter.press("Enter");
  await expect.poll(() => revenueRequests.some((url) => url.includes(`tenantId=${tenantId}`) && url.includes(`planId=${planId}`) && url.includes("subscriptionStatus=ACTIVE"))).toBe(true);
  const expiryFilter = page.getByRole("combobox", { name: "Cửa sổ thuê bao sắp hết hạn" });
  await expiryFilter.click();
  await page.locator(".ant-select-dropdown:visible").getByText("Trong 7 ngày", { exact: true }).click();
  await expect.poll(() => revenueRequests.some((url) => url.includes("expiryDays=7"))).toBe(true);
  await expect(page.getByText("Kết quả thanh toán")).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${evidenceDir}/01-platform-revenue.png`, fullPage: true });
  await page.getByRole("tab", { name: "Tăng trưởng & sức khỏe khách hàng" }).click();
  await expect(page.getByRole("heading", { name: "Cảnh báo khách hàng cần hành động" })).toBeVisible();
  await expect(page.getByText("Công ty cần hỗ trợ")).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${evidenceDir}/02-platform-customer-health.png`, fullPage: true });
});

test("HR lọc và drill-down báo cáo hiệu quả, rủi ro", async ({ page }) => {
  await seedUser(page, false);
  const workforceRequests: string[] = [];
  let checkinRequest = "";
  await page.route(`**/api/v1/tenants/${tenantId}/dashboard/hr*`, (route) => route.fulfill({ json: api({ personnel: { totalEmployees: 15, newThisMonth: 15 }, attendance: { presentToday: 8, onSiteNow: 3, lateToday: 1, pendingReview: 2, missingCheckoutToday: 1 }, violations: { unresolved: 2, resolvedThisMonth: 5, unresolvedByType: {} }, sites: { totalSites: 4, employeesOnSiteNow: 3 } }) }));
  await page.route(`**/api/v1/tenants/${tenantId}/sites?*`, (route) => route.fulfill({ json: api(pageData([{ id: siteId, name: "Công trình Tây Hồ", status: "active" }])) }));
  await page.route(`**/api/v1/tenants/${tenantId}/workspaces?*`, (route) => route.fulfill({ json: api(pageData([{ id: workspaceId, name: "Kỹ thuật" }])) }));
  await page.route(`**/api/v1/tenants/${tenantId}/sites/${siteId}/shifts?*`, (route) => route.fulfill({ json: api(pageData([{ id: shiftId, name: "Ca sáng", startTime: "08:00:00", endTime: "17:00:00" }])) }));
  await page.route(`**/api/v1/tenants/${tenantId}/employees?*`, (route) => route.fulfill({ json: api(pageData([{ id: employeeId, fullName: "Nguyễn Văn A", firstName: "Văn A", lastName: "Nguyễn", employeeCode: "AP008" }])) }));
  await page.route(`**/api/v1/tenants/${tenantId}/reports/workforce-effectiveness?*`, (route) => {
    workforceRequests.push(route.request().url());
    return route.fulfill({ json: api(workforce) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/reports/risk-compliance?*`, (route) => route.fulfill({ json: api(risk) }));
  await page.route(`**/api/v1/tenants/${tenantId}/checkin?*`, (route) => {
    checkinRequest = route.request().url();
    return route.fulfill({ json: api(pageData([])) });
  });
  await page.goto("/customer/dashboard");
  await expect(page.getByText("Báo cáo điều hành công ty")).toBeVisible();
  await expect(page.getByText("66.2%")).toBeVisible();
  for (const name of ["Lọc theo công trình", "Lọc báo cáo theo workspace", "Lọc báo cáo theo ca", "Lọc báo cáo theo nhân viên"]) {
    const filter = page.getByRole("combobox", { name });
    await filter.press("ArrowDown");
    await filter.press("Enter");
  }
  await expect.poll(() => workforceRequests.some((raw) => {
    const url = new URL(raw);
    return url.searchParams.get("siteId") === siteId
      && url.searchParams.get("workspaceId") === workspaceId
      && url.searchParams.get("shiftId") === shiftId
      && url.searchParams.get("employeeId") === employeeId;
  })).toBe(true);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${evidenceDir}/03-tenant-workforce.png`, fullPage: true });
  await page.getByRole("button", { name: "Xem chấm công" }).click();
  await expect(page).toHaveURL(/\/customer\/attendance\?/);
  await expect.poll(() => {
    if (!checkinRequest) return false;
    const url = new URL(checkinRequest);
    return url.searchParams.get("siteId") === siteId
      && url.searchParams.get("workspaceId") === workspaceId
      && url.searchParams.get("shiftId") === shiftId
      && url.searchParams.get("employeeId") === employeeId
      && Boolean(url.searchParams.get("from"))
      && Boolean(url.searchParams.get("to"));
  }).toBe(true);
  await page.goBack();
  await expect(page.getByText("Báo cáo điều hành công ty")).toBeVisible();
  await page.getByRole("tab", { name: /Rủi ro & tuân thủ/ }).click();
  await expect(page.getByText("Vi phạm / 100 lượt công")).toBeVisible();
  await expect(page.getByText("Điểm nóng rủi ro")).toBeVisible();
  await expect(page.getByText("Pareto nguyên nhân vi phạm")).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${evidenceDir}/04-tenant-risk.png`, fullPage: true });
});
