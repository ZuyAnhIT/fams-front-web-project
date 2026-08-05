import { expect, test, type Page } from '@playwright/test';

const tenantId = '11111111-1111-4111-8111-111111111111';
const api = (data: unknown) => ({ success: true, message: 'Success', data });

async function seedUser(page: Page, role: 'HR_MANAGER' | 'SITE_SUPERVISOR' | 'EMPLOYEE', permissions: string[]) {
  await page.addInitScript(({ seededTenant, seededRole, seededPermissions }) => {
    const now = new Date().toISOString();
    localStorage.setItem('fams_access_token', 'dashboard-e2e-access');
    localStorage.setItem('fams_refresh_token', 'dashboard-e2e-refresh');
    localStorage.setItem('fams_user', JSON.stringify({
      id: 'dashboard-user', email: 'dashboard@example.com', displayName: 'Nguyễn Minh',
      emailVerified: true, active: true, createdAt: now, updatedAt: now,
      role: seededRole, tenantId: seededTenant, permissions: seededPermissions, memberships: [],
    }));
  }, { seededTenant: tenantId, seededRole: role, seededPermissions: permissions });
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/**', (route) => route.fulfill({ json: api(null) }));
});

test('Dashboard HR hiển thị số liệu và map loại violation thiếu key thành 0', async ({ page }) => {
  await seedUser(page, 'HR_MANAGER', ['employees:list', 'attendance:list', 'violations:list', 'sites:list']);
  await page.route(`**/api/v1/tenants/${tenantId}/dashboard/hr`, (route) => route.fulfill({ json: api({
    personnel: { totalEmployees: 40, newThisMonth: 3 },
    attendance: { presentToday: 32, lateToday: 2, onSiteNow: 18 },
    violations: { unresolved: 17, resolvedThisMonth: 9, unresolvedByType: { no_response: 8, location_fail: 9 } },
    sites: { totalSites: 13, employeesOnSiteNow: 18 },
  }) }));

  await page.goto('/customer/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Tổng nhân viên')).toBeVisible();
  await expect(page.getByText('40', { exact: true })).toBeVisible();
  await expect(page.getByText('Vi phạm chưa xử lý')).toBeVisible();
  await expect(page.getByText('17', { exact: true })).toBeVisible();
  await expect(page.getByText('Liveness')).toBeVisible();
  await expect(page.getByText('Face ID', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Vi phạm chưa xử lý/ })).toHaveAttribute('href', '/customer/violations?resolved=false');
});

test('Dashboard Supervisor hỗ trợ nhiều site và danh sách người đang có mặt', async ({ page }) => {
  await seedUser(page, 'SITE_SUPERVISOR', ['employees:list']);
  await page.route(`**/api/v1/tenants/${tenantId}/dashboard/supervisor`, (route) => route.fulfill({ json: api({ supervisedSites: [
    { siteId: 'site-a', siteName: 'Công trình Riverside', expectedToday: 24, onSiteNow: 1, onSiteEmployees: [{ employeeId: 'employee-a', firstName: 'An', lastName: 'Nguyễn', employeeCode: 'NV001', checkinId: 'checkin-a', checkInAt: '2026-08-04T00:05:00Z' }] },
    { siteId: 'site-b', siteName: 'Kho Đông Anh', expectedToday: 10, onSiteNow: 0, onSiteEmployees: [] },
  ] }) }));

  await page.goto('/customer/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Công trình Riverside')).toBeVisible();
  await expect(page.getByText('Kho Đông Anh')).toBeVisible();
  await expect(page.getByText('Nguyễn An')).toBeVisible();
  await expect(page.getByText('1/24 nhân viên đang có mặt')).toBeVisible();
});

test('Dashboard Supervisor coi supervisedSites rỗng là empty-state bình thường', async ({ page }) => {
  await seedUser(page, 'SITE_SUPERVISOR', []);
  await page.route(`**/api/v1/tenants/${tenantId}/dashboard/supervisor`, (route) => route.fulfill({ json: api({ supervisedSites: [] }) }));

  await page.goto('/customer/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Chưa có công trình cần giám sát hôm nay')).toBeVisible();
  await expect(page.getByText('Không thể tải hiện trường')).toHaveCount(0);
});

test('Dashboard nhân viên hiển thị đủ ca, chấm công, công tháng và việc cần xử lý', async ({ page }) => {
  await seedUser(page, 'EMPLOYEE', []);
  await page.route(`**/api/v1/tenants/${tenantId}/dashboard/employee`, (route) => route.fulfill({ json: api({
    todayShifts: [{
      assignmentId: 'assignment-a', siteId: 'site-a', siteName: 'Công trình Riverside', role: 'worker',
      shift: { shiftId: 'shift-a', name: 'Ca sáng', startTime: '08:00:00', endTime: '17:00:00' },
    }],
    checkin: { checkinId: 'checkin-a', siteId: 'site-a', status: 'valid', checkInAt: '2026-08-04T01:00:00Z', checkOutAt: null, workMinutes: null, open: true },
    monthlyAttendance: { month: '2026-08', presentDays: 12, lateDays: 1, earlyLeaveDays: 0, missingCheckoutDays: 1, totalOtMinutes: 90, totalWorkMinutes: 5760 },
    alerts: { unreadNotifications: 2, pendingExplanations: 1 },
  }) }));

  await page.goto('/customer/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Ca hôm nay')).toBeVisible();
  await expect(page.getByText('Công trình Riverside')).toBeVisible();
  await expect(page.getByText('Đang trong ca')).toBeVisible();
  await expect(page.getByText('Ngày công tháng')).toBeVisible();
  await expect(page.getByText('1 mục cần giải thích')).toBeVisible();
  await expect(page.getByText('2 thông báo chưa đọc').first()).toBeVisible();
});
