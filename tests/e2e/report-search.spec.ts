import { expect, test, type Page } from '@playwright/test';

const tenantId = '11111111-1111-4111-8111-111111111111';
const siteId = '22222222-2222-4222-8222-222222222222';
const employeeId = '33333333-3333-4333-8333-333333333333';
const checkinId = '44444444-4444-4444-8444-444444444444';
const api = (data: unknown) => ({ success: true, message: 'Success', data });
const pageData = (content: unknown[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true });

const employee = { id: employeeId, tenantId, firstName: 'An', lastName: 'Nguyễn', fullName: 'Nguyễn An', email: 'an@example.com', employeeCode: 'NV001', department: 'Thi công', status: 'active', createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z' };
const employeeRef = { employeeId, employeeName: 'Nguyễn An', employeeCode: 'NV001' };
const site = { id: siteId, tenantId, name: 'Công trình Riverside', code: 'RIV', address: 'Quận 1', timezone: 'Asia/Ho_Chi_Minh', checkinPolicy: 'gps_only', status: 'active', createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z' };
const attendance = { id: 'attendance-1', tenantId, employeeId, employeeName: 'Nguyễn An', siteId, siteName: site.name, shiftId: null, assignmentId: 'assignment-1', attendanceDate: '2026-08-05', firstCheckinAt: '2026-08-05T01:00:00Z', lastCheckoutAt: null, totalWorkMinutes: 420, sessionCount: 1, status: 'incomplete', late: true, lateMinutes: 5, earlyLeave: false, earlyLeaveMinutes: 0, otMinutes: 30, missingCheckout: true, hasPendingReviewSession: false, hasRejectedSession: false, hasRandomCheckFailure: false, adjustmentReason: null, createdAt: '2026-08-05T01:00:00Z', updatedAt: '2026-08-05T01:00:00Z' };
const monthly = { tenantId, employeeId, employeeName: 'Nguyễn An', siteId, siteName: site.name, year: 2026, month: 8, presentDays: 20, totalWorkMinutes: 9600, lateDays: 2, totalLateMinutes: 15, earlyLeaveDays: 1, totalEarlyLeaveMinutes: 10, totalOtMinutes: 120, missingCheckoutDays: 1, daysWithPendingReview: 1, daysWithRejectedSession: 0, daysWithRandomCheckFailure: 1, exceedsRandomCheckFailureThreshold: false };
const violation = { id: 'violation-1', employeeId, siteId, violationType: 'face_fail', checkDate: '2026-08-05', description: 'Face ID không khớp', resolved: false, resolvedAt: null, employeeNote: null, employeePhotoUrl: null, createdAt: '2026-08-05T02:00:00Z', resolution: null, affectsAttendance: true };

async function seed(page: Page, role: 'HR_MANAGER' | 'SITE_SUPERVISOR', permissions: string[]) {
  await page.addInitScript(({ seededTenant, seededRole, seededPermissions }) => {
    localStorage.setItem('fams_access_token', 'report-access');
    localStorage.setItem('fams_refresh_token', 'report-refresh');
    localStorage.setItem('fams_user', JSON.stringify({ id: 'report-user', email: 'hr@example.com', displayName: 'HR Báo cáo', emailVerified: true, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), role: seededRole, tenantId: seededTenant, permissions: seededPermissions, memberships: [] }));
  }, { seededTenant: tenantId, seededRole: role, seededPermissions: permissions });
}

async function mockDirectories(page: Page) {
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/sites(?:\\?.*)?$`), (route) => route.fulfill({ json: api(pageData([site])) }));
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/employees(?:\\?.*)?$`), (route) => route.fulfill({ json: api(pageData([employee])) }));
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/**', (route) => {
    if (route.request().url().includes('/notifications')) return route.fulfill({ json: api({ items: [], unreadCount: 0, totalElements: 0, totalPages: 0, page: 0, size: 5 }) });
    return route.fulfill({ json: api(null) });
  });
});

test('HR xem đủ báo cáo ngày, tháng, vi phạm và hiện diện theo contract', async ({ page }) => {
  await seed(page, 'HR_MANAGER', ['reports:list', 'reports:export', 'attendance:export', 'employees:list']);
  await mockDirectories(page);
  await page.route(`**/api/v1/tenants/${tenantId}/reports/attendance/daily*`, (route) => route.fulfill({ json: api({ date: '2026-08-05', siteId: null, totalPresent: 24, totalAbsent: 1, totalLate: 2, totalEarlyLeave: 1, totalMissingCheckout: 1, totalWorkMinutes: 9120, totalOtMinutes: 120, absentEmployees: [employeeRef], records: pageData([attendance]) }) }));
  await page.route(`**/api/v1/tenants/${tenantId}/reports/attendance/monthly*`, (route) => route.fulfill({ json: api({ year: 2026, month: 8, siteId: null, totalEmployees: 40, totalPresentDays: 800, totalWorkMinutes: 384000, totalLateDays: 12, totalLateMinutes: 80, totalEarlyLeaveDays: 4, totalEarlyLeaveMinutes: 30, totalMissingCheckoutDays: 2, totalOtMinutes: 900, totalRowsWithPendingReview: 1, totalRowsWithRejectedSession: 0, totalRowsWithRandomCheckFailure: 1, records: pageData([monthly]) }) }));
  let violationExported = false;
  await page.route(`**/api/v1/tenants/${tenantId}/reports/violations*`, (route) => route.fulfill({ json: api({ from: '2026-08-01', to: '2026-08-31', siteId: null, employeeId: null, violationType: null, totalViolations: 7, resolvedCount: 4, unresolvedCount: 3, affectsAttendanceCount: 2, byViolationType: { face_fail: 3, no_response: 4 }, bySeverity: { HIGH: 3, LOW: 4 }, bySite: { [siteId]: 7 }, byEmployee: { [employeeId]: 3 }, records: pageData([violation]) }) }));
  await page.route(`**/api/v1/tenants/${tenantId}/reports/violations/export*`, (route) => {
    violationExported = true;
    return route.fulfill({ status: 200, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', body: 'xlsx' });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/reports/sites/presence*`, (route) => route.fulfill({ json: api({ reportedAt: '2026-08-05T07:27:20Z', totalSites: 1, totalPresent: 20, totalAssigned: 24, totalAbsent: 4, sites: pageData([{ siteId, siteName: site.name, timezone: site.timezone, assignedCount: 24, presentCount: 20, absentCount: 4, presentEmployees: [], absentEmployees: [employeeRef] }]) }) }));

  await page.goto('/customer/reports', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Báo cáo vận hành' })).toBeVisible();
  await expect(page.getByText('24', { exact: true })).toBeVisible();
  await expect(page.getByText('Nguyễn An')).toBeVisible();

  await page.getByRole('tab', { name: 'Công tháng & Export' }).click();
  await expect(page.getByText('40', { exact: true })).toBeVisible();
  await expect(page.getByText(/2 nhóm cảnh báo/)).toBeVisible();

  await page.getByRole('tab', { name: 'Vi phạm theo kỳ' }).click();
  await expect(page.getByText('Theo mức độ nghiêm trọng')).toBeVisible();
  await expect(page.getByText('Cao · xác thực danh tính')).toBeVisible();
  await expect(page.getByText('Top công trình')).toBeVisible();
  await page.locator('.ant-tabs-tabpane-active').getByRole('button', { name: 'Xuất Excel' }).click();
  await expect.poll(() => violationExported).toBe(true);

  await page.getByRole('tab', { name: 'Hiện diện công trình' }).click();
  await expect(page.getByText('20/24 có mặt')).toBeVisible();
  await expect(page.getByText('4', { exact: true })).toBeVisible();
});

test('Export bảng công xử lý 409 và chỉ xuất bất chấp cảnh báo sau xác nhận HR', async ({ page }) => {
  await seed(page, 'HR_MANAGER', ['reports:list', 'attendance:export', 'employees:list']);
  await mockDirectories(page);
  await page.route(`**/api/v1/tenants/${tenantId}/reports/attendance/daily*`, (route) => route.fulfill({ json: api({ date: '2026-08-05', siteId: null, totalPresent: 0, totalAbsent: 0, totalLate: 0, totalEarlyLeave: 0, totalMissingCheckout: 0, totalWorkMinutes: 0, totalOtMinutes: 0, absentEmployees: [], records: pageData([]) }) }));
  await page.route(`**/api/v1/tenants/${tenantId}/reports/attendance/monthly*`, (route) => route.fulfill({ json: api({ year: 2026, month: 8, siteId: null, totalEmployees: 1, totalPresentDays: 20, totalWorkMinutes: 9600, totalLateDays: 0, totalLateMinutes: 0, totalEarlyLeaveDays: 0, totalEarlyLeaveMinutes: 0, totalMissingCheckoutDays: 0, totalOtMinutes: 0, totalRowsWithPendingReview: 1, totalRowsWithRejectedSession: 0, totalRowsWithRandomCheckFailure: 0, records: pageData([monthly]) }) }));
  let forcedExport = false;
  await page.route(`**/api/v1/tenants/${tenantId}/reports/attendance/export*`, (route) => {
    const forced = new URL(route.request().url()).searchParams.get('confirmDespiteWarnings') === 'true';
    if (!forced) return route.fulfill({ status: 409, contentType: 'application/json', json: { success: false, errorCode: 'ATTENDANCE_NOT_READY', userMessage: 'Còn 1 dòng chờ duyệt.' } });
    forcedExport = true;
    return route.fulfill({ status: 200, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', body: 'xlsx' });
  });

  await page.goto('/customer/reports', { waitUntil: 'domcontentloaded' });
  await page.getByRole('tab', { name: 'Công tháng & Export' }).click();
  await page.getByRole('button', { name: 'Xuất Excel' }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: 'Bảng công chưa sẵn sàng để tính lương' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Vẫn xuất Excel' }).click();
  await expect.poll(() => forcedExport).toBe(true);
});

test('Tìm kiếm toàn cục debounce và trả đúng ba nhóm dữ liệu', async ({ page }) => {
  await seed(page, 'HR_MANAGER', ['reports:list', 'employees:list']);
  let searchQuery = '';
  await page.route(`**/api/v1/tenants/${tenantId}/search*`, (route) => {
    searchQuery = new URL(route.request().url()).searchParams.get('q') || '';
    return route.fulfill({ json: api({ query: searchQuery, limit: 5, employees: [employee], sites: [site], checkins: [{ id: checkinId, tenantId, employeeId, siteId, shiftId: null, assignmentId: 'assignment-1', status: 'valid', message: '', checkInAt: '2026-08-05T01:00:00Z', checkInLat: 0, checkInLon: 0, checkInAccuracy: 5, checkInInsideGeofence: true, checkOutAt: null, checkOutLat: null, checkOutLon: null, checkOutAccuracy: null, checkOutInsideGeofence: null, workMinutes: null, gpsRiskScore: 0, deviceId: null, faceVerified: null, livenessVerified: null, faceVerifyScore: null, checkoutFaceVerified: null, checkoutLivenessVerified: null, checkoutFaceVerifyScore: null, effectiveCheckinPolicy: 'gps_only', source: 'online', createdAt: '2026-08-05T01:00:00Z', updatedAt: '2026-08-05T01:00:00Z', employeeName: 'Nguyễn An', employeeCode: 'NV001', siteName: site.name }] }) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/reports/attendance/daily*`, (route) => route.fulfill({ json: api({ date: '2026-08-05', siteId: null, totalPresent: 0, totalAbsent: 0, totalLate: 0, totalEarlyLeave: 0, totalMissingCheckout: 0, totalWorkMinutes: 0, totalOtMinutes: 0, absentEmployees: [], records: pageData([]) }) }));

  await page.goto('/customer/reports', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Tìm kiếm nhanh toàn hệ thống').fill('nguyen');
  await expect.poll(() => searchQuery).toBe('nguyen');
  await expect(page.getByText('Nhân viên', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Công trình', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Check-in gần đây')).toBeVisible();
  await page.getByLabel('Tìm kiếm nhanh toàn hệ thống').fill(checkinId);
  await expect.poll(() => searchQuery).toBe(checkinId);
  await expect(page.getByText('Check-in theo mã')).toBeVisible();
});

test('Supervisor xem báo cáo theo site-scope nhưng không thấy nút export', async ({ page }) => {
  await seed(page, 'SITE_SUPERVISOR', ['reports:list', 'employees:list']);
  await mockDirectories(page);
  await page.route(`**/api/v1/tenants/${tenantId}/reports/attendance/daily*`, (route) => route.fulfill({ json: api({ date: '2026-08-05', siteId: null, totalPresent: 1, totalAbsent: 0, totalLate: 0, totalEarlyLeave: 0, totalMissingCheckout: 0, totalWorkMinutes: 480, totalOtMinutes: 0, absentEmployees: [], records: pageData([attendance]) }) }));
  await page.route(`**/api/v1/tenants/${tenantId}/reports/attendance/monthly*`, (route) => route.fulfill({ json: api({ year: 2026, month: 8, siteId: null, totalEmployees: 1, totalPresentDays: 1, totalWorkMinutes: 480, totalLateDays: 0, totalLateMinutes: 0, totalEarlyLeaveDays: 0, totalEarlyLeaveMinutes: 0, totalMissingCheckoutDays: 0, totalOtMinutes: 0, totalRowsWithPendingReview: 0, totalRowsWithRejectedSession: 0, totalRowsWithRandomCheckFailure: 0, records: pageData([monthly]) }) }));

  await page.goto('/customer/reports', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Báo cáo vận hành' })).toBeVisible();
  await page.getByRole('tab', { name: 'Công tháng & Export' }).click();
  await expect(page.getByRole('button', { name: 'Xuất Excel' })).toHaveCount(0);
});
