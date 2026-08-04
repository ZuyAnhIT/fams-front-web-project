import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const evidenceDir = 'docs/test-evidence/violation-management';
const tenantId = '11111111-1111-4111-8111-111111111111';
const siteId = '22222222-2222-4222-8222-222222222222';
const employeeId = '33333333-3333-4333-8333-333333333333';
const violationId = '44444444-4444-4444-8444-444444444444';
const api = (data: unknown) => ({ success: true, message: 'Success', data });
const pageData = (content: unknown[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true });

async function seedUser(page: Page, role: 'HR_MANAGER' | 'EMPLOYEE', permissions: string[]) {
  await page.addInitScript(({ seededTenant, seededRole, seededPermissions }) => {
    const now = new Date().toISOString();
    localStorage.setItem('fams_access_token', 'violation-e2e-access');
    localStorage.setItem('fams_refresh_token', 'violation-e2e-refresh');
    localStorage.setItem('fams_user', JSON.stringify({
      id: 'violation-user', email: 'user@example.com', displayName: 'Nguyễn An',
      emailVerified: true, active: true, createdAt: now, updatedAt: now,
      role: seededRole, tenantId: seededTenant, permissions: seededPermissions, memberships: [],
    }));
  }, { seededTenant: tenantId, seededRole: role, seededPermissions: permissions });
}

test.beforeAll(() => mkdirSync(evidenceDir, { recursive: true }));
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/**', (route) => {
    if (route.request().url().includes('/notifications')) {
      return route.fulfill({ json: api({ items: [], unreadCount: 0, totalElements: 0, totalPages: 0, page: 0, size: 5 }) });
    }
    return route.fulfill({ json: api(null) });
  });
});

test('HR lọc, xem bằng chứng và dismiss vi phạm với lý do audit', async ({ page }) => {
  await seedUser(page, 'HR_MANAGER', ['violations:list', 'violations:read', 'violations:update', 'sites:list', 'employees:list']);
  const violation = {
    id: violationId, employeeId, siteId, violationType: 'face_fail', checkDate: '2026-08-03',
    description: 'Face ID không khớp', resolved: false, resolvedAt: null,
    resolution: null, resolutionReason: null, affectsAttendance: false,
    employeeNote: 'Camera bị ngược sáng',
    employeePhotoUrl: `/api/v1/tenants/${tenantId}/violations/${violationId}/explanation-photo`,
    createdAt: '2026-08-03T08:05:00Z',
  };
  let dismissBody: Record<string, unknown> = {};
  let impactBody: Record<string, unknown> = {};
  let photoRequests = 0;
  let dismissed = false;
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/sites(?:\\?.*)?$`), (route) => route.fulfill({ json: api(pageData([{ id: siteId, tenantId, name: 'Công trình Riverside', status: 'active' }])) }));
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/employees(?:\\?.*)?$`), (route) => route.fulfill({ json: api(pageData([{ id: employeeId, tenantId, firstName: 'An', lastName: 'Nguyễn', fullName: 'Nguyễn An', status: 'active' }])) }));
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/violations(?:\\?.*)?$`), (route) => route.fulfill({ json: api(pageData([{
    ...violation,
    resolved: dismissed,
    resolution: dismissed ? 'dismissed' : null,
    resolutionReason: dismissed ? 'Đã xác nhận camera ngược sáng với quản lý site.' : null,
    resolvedAt: dismissed ? '2026-08-04T00:00:00Z' : null,
  }])) }));
  await page.route(`**/api/v1/tenants/${tenantId}/violations/${violationId}`, (route) => route.fulfill({ json: api({
    ...violation,
    resolved: dismissed,
    resolution: dismissed ? 'dismissed' : null,
    resolutionReason: dismissed ? 'Đã xác nhận camera ngược sáng với quản lý site.' : null,
    resolvedAt: dismissed ? '2026-08-04T00:00:00Z' : null,
    tenantId, scheduledCheckId: 'scheduled-1', checkResponseId: 'response-1', checkinId: null,
    resolvedBy: dismissed ? 'violation-user' : null,
    scheduledCheck: { id: 'scheduled-1', scheduledAt: '2026-08-03T08:00:00Z', expiresAt: '2026-08-03T08:05:00Z', status: 'responded', checkIndex: 1 },
    checkResponse: { id: 'response-1', respondedAt: '2026-08-03T08:03:00Z', latitude: 10.73, longitude: 106.72, accuracyMeters: 9, faceImageUrl: null, livenessScore: 0.91, locationVerified: true, faceVerified: false, livenessVerified: true, outcome: 'fail', failureReason: 'face_fail' },
  }) }));
  await page.route(`**/api/v1/tenants/${tenantId}/violations/${violationId}/dismiss`, (route) => {
    dismissBody = route.request().postDataJSON() as Record<string, unknown>;
    dismissed = true;
    return route.fulfill({ json: api({ id: violationId, resolution: 'dismissed', resolutionReason: dismissBody.reason, resolved: true, resolvedAt: '2026-08-04T00:00:00Z', resolvedBy: 'violation-user' }) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/violations/${violationId}/attendance-impact`, (route) => {
    impactBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: api({ id: violationId, affectsAttendance: impactBody.affectsAttendance }) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/violations/${violationId}/explanation-photo`, (route) => {
    photoRequests += 1;
    return route.fulfill({
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+3MxZ5wAAAABJRU5ErkJggg==', 'base64'),
    });
  });

  await page.goto('/customer/violations', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Face ID không đạt', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Chi tiết' }).click();
  const detail = page.getByRole('dialog', { name: 'Chi tiết vi phạm' });
  await expect(detail.getByText('Camera bị ngược sáng')).toBeVisible();
  await expect(detail.getByAltText('Ảnh giải trình của nhân viên')).toBeVisible();
  expect(photoRequests).toBe(1);
  await expect(detail.getByText('10.73, 106.72')).toBeVisible();
  await expect(detail.getByText('Đánh dấu ảnh hưởng bảng công')).toBeVisible();
  await detail.getByRole('switch').click();
  await expect.poll(() => impactBody).toEqual({ affectsAttendance: true });
  await detail.getByRole('button', { name: 'Bỏ qua false positive' }).click();
  const resolution = page.getByRole('dialog', { name: 'Bỏ qua vi phạm' });
  await resolution.getByRole('textbox').fill('Đã xác nhận camera ngược sáng với quản lý site.');
  await resolution.getByRole('button', { name: 'Xác nhận bỏ qua' }).click();
  await expect.poll(() => dismissBody).toEqual({ reason: 'Đã xác nhận camera ngược sáng với quản lý site.' });
  await expect(detail.getByText('Quyết định xử lý')).toBeVisible();
  await expect(detail.getByText('Đã xác nhận camera ngược sáng với quản lý site.')).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/01-hr-violation-detail.png`, fullPage: true });
});

test('Nhân viên dùng hộp thư hợp nhất và POST đúng explainEndpoint của server', async ({ page }) => {
  await seedUser(page, 'EMPLOYEE', []);
  const explainEndpoint = `/api/v1/tenants/${tenantId}/violations/${violationId}/explain`;
  let explanationBody: Record<string, unknown> = {};
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/me/exceptions(?:\\?.*)?$`), (route) => route.fulfill({ json: api([{
    id: violationId, sourceType: 'violation', reasonType: 'no_response', date: '2026-08-03',
    description: 'Không phản hồi random check trong thời hạn', explainEndpoint,
    hasExplanation: true, employeeNote: 'Điện thoại hết pin.', createdAt: '2026-08-03T08:05:00Z',
  }]) }));
  await page.route(`**/api/v1/tenants/${tenantId}/violations/${violationId}/explain`, (route) => {
    explanationBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: api({ id: violationId, employeeNote: explanationBody.note, employeePhotoUrl: null, updatedAt: '2026-08-04T00:00:00Z' }) });
  });

  await page.goto('/customer/exceptions', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Không phản hồi kiểm tra')).toBeVisible();
  await expect(page.getByText('Đã giải trình · chờ HR')).toBeVisible();
  await page.getByRole('button', { name: 'Cập nhật giải trình' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cập nhật giải trình' });
  await expect(dialog.getByRole('textbox')).toHaveValue('Điện thoại hết pin.');
  await dialog.getByRole('textbox').fill('Điện thoại mất mạng tại công trình.');
  await dialog.getByRole('button', { name: 'Gửi cho HR' }).click();
  await expect.poll(() => explanationBody).toEqual({ note: 'Điện thoại mất mạng tại công trình.' });
});

test('Nhân viên gửi ảnh private bằng multipart tới endpoint check-in do server trả', async ({ page }) => {
  await seedUser(page, 'EMPLOYEE', ['checkins:read']);
  const checkinId = '55555555-5555-4555-8555-555555555555';
  const explainEndpoint = `/api/v1/tenants/${tenantId}/checkin/${checkinId}/explain`;
  let contentType = '';
  let multipartBody = '';
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/me/exceptions(?:\\?.*)?$`), (route) => route.fulfill({ json: api([{
    id: checkinId, sourceType: 'checkin', reasonType: 'pending_review', date: '2026-08-04',
    description: 'Chấm công ngoài vùng cần HR xem xét', explainEndpoint,
    hasExplanation: false, employeeNote: null, createdAt: '2026-08-04T08:05:00Z',
  }]) }));
  await page.route(`**/api/v1/tenants/${tenantId}/checkin/${checkinId}/explain`, (route) => {
    contentType = route.request().headers()['content-type'] || '';
    multipartBody = route.request().postData() || '';
    return route.fulfill({ json: api({ id: checkinId, employeeNote: 'GPS bị nhiễu.', employeePhotoUrl: `/api/v1/tenants/${tenantId}/checkin/${checkinId}/explanation-photo`, updatedAt: '2026-08-04T09:00:00Z' }) });
  });

  await page.goto('/customer/exceptions', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Giải thích' }).click();
  const dialog = page.getByRole('dialog', { name: 'Gửi giải trình' });
  await dialog.getByRole('textbox').fill('GPS bị nhiễu.');
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'evidence.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgo=', 'base64'),
  });
  await dialog.getByRole('button', { name: 'Gửi cho HR' }).click();

  await expect.poll(() => contentType).toContain('multipart/form-data; boundary=');
  expect(multipartBody).toContain('name="note"');
  expect(multipartBody).toContain('GPS bị nhiễu.');
  expect(multipartBody).toContain('filename="evidence.png"');
});
