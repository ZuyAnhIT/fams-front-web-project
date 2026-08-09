import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const evidenceDir = 'docs/test-evidence/saved-filters-audit-tenant-ops';
const tenantId = '11111111-1111-4111-8111-111111111111';
const otherTenantId = '22222222-2222-4222-8222-222222222222';
const employeeId = '33333333-3333-4333-8333-333333333333';
const siteId = '44444444-4444-4444-8444-444444444444';
const auditId = '55555555-5555-4555-8555-555555555555';
const api = (data: unknown) => ({ success: true, message: 'Success', data });
const pageData = (content: unknown[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true });

async function seedUser(page: Page, role: string, permissions: string[], activeTenantId: string | null = tenantId) {
  await page.addInitScript(({ seededRole, seededPermissions, seededTenant }) => {
    const now = new Date().toISOString();
    localStorage.setItem('fams_access_token', 'audit-e2e-access');
    localStorage.setItem('fams_refresh_token', 'audit-e2e-refresh');
    localStorage.setItem('fams_user', JSON.stringify({
      id: 'audit-user', email: 'audit@example.com', displayName: 'Audit User', emailVerified: true,
      active: true, createdAt: now, updatedAt: now, role: seededRole, tenantId: seededTenant,
      permissions: seededPermissions, memberships: [],
    }));
  }, { seededRole: role, seededPermissions: permissions, seededTenant: activeTenantId });
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

test('HR tự áp dụng, lưu bộ lọc cá nhân và export đúng toàn bộ filter đang xem', async ({ page }) => {
  await seedUser(page, 'HR_MANAGER', ['violations:list', 'violations:read', 'reports:export', 'sites:list', 'employees:list']);
  let listResolved: string | null = null;
  let createBody: Record<string, unknown> = {};
  let exportParams = new URLSearchParams();
  const saved = [{
    id: 'filter-1', resourceType: 'violations', name: 'Face ID chưa xử lý',
    filterParams: { resolved: false, violationType: 'face_fail', sortBy: 'checkDate', sortDir: 'desc' },
    isDefault: true, createdAt: '2026-08-06T08:00:00Z', updatedAt: '2026-08-06T08:00:00Z',
  }];
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/sites(?:\\?.*)?$`), (route) => route.fulfill({ json: api(pageData([{ id: siteId, name: 'Site A' }])) }));
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/employees(?:\\?.*)?$`), (route) => route.fulfill({ json: api(pageData([{ id: employeeId, firstName: 'An', lastName: 'Nguyễn' }])) }));
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/saved-filters(?:\\?.*)?$`), (route) => {
    if (route.request().method() === 'POST') {
      createBody = route.request().postDataJSON() as Record<string, unknown>;
      const created = { ...saved[0], ...createBody, id: 'filter-2', isDefault: false, name: String(createBody.name) };
      saved.push(created as typeof saved[number]);
      return route.fulfill({ status: 201, json: api(created) });
    }
    return route.fulfill({ json: api(saved) });
  });
  await page.route(new RegExp(`/api/v1/tenants/${tenantId}/violations(?:\\?.*)?$`), (route) => {
    listResolved = new URL(route.request().url()).searchParams.get('resolved');
    return route.fulfill({ json: api(pageData([{ id: 'violation-1', employeeId, siteId, violationType: 'face_fail', checkDate: '2026-08-06', description: 'Face mismatch', resolved: false, resolvedAt: null, employeeNote: null, employeePhotoUrl: null, createdAt: '2026-08-06T08:00:00Z', resolution: null, affectsAttendance: false }])) });
  });
  await page.route(`**/api/v1/tenants/${tenantId}/reports/violations/export*`, (route) => {
    exportParams = new URL(route.request().url()).searchParams;
    return route.fulfill({
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      headers: { 'Content-Disposition': 'attachment; filename="violations-export.xlsx"' },
      body: Buffer.from('fake-xlsx'),
    });
  });

  await page.goto('/customer/violations');
  await expect.poll(() => listResolved).toBe('false');
  await expect(page.getByText('★ Face ID chưa xử lý')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu bộ lọc hiện tại' }).click();
  const saveDialog = page.getByRole('dialog', { name: 'Lưu bộ lọc hiện tại' });
  await saveDialog.getByLabel('Tên bộ lọc').fill('Theo dõi Face ID');
  await saveDialog.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect.poll(() => createBody).toMatchObject({
    resourceType: 'violations', name: 'Theo dõi Face ID', isDefault: false,
    filterParams: { resolved: false, violationType: 'face_fail' },
  });

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất Excel theo bộ lọc' }).click();
  await download;
  expect(exportParams.get('violationType')).toBe('face_fail');
  expect(exportParams.get('resolved')).toBe('false');
  await page.screenshot({ path: `${evidenceDir}/01-saved-filter-and-export.png`, fullPage: true });
});

test('Company Admin xem diff và trace luôn giữ tenant hiện tại', async ({ page }) => {
  await seedUser(page, 'TENANT_ADMIN', ['audit:list', 'audit:read']);
  const entry = {
    id: auditId, tenantId, actorId: 'audit-user', actorEmail: 'admin@tenant.vn', entityType: 'Employee',
    entityId: employeeId, action: 'UPDATE', oldValue: { status: 'active', profile: { title: 'Staff' } },
    newValue: { status: 'inactive', profile: { title: 'Supervisor' } }, requestId: 'req-audit-001',
    ipAddress: '192.168.1.7', userAgent: 'Playwright', createdAt: '2026-08-06T08:00:00Z',
  };
  let listTenantId: string | null = null;
  let traceRequestId: string | null = null;
  await page.route(new RegExp('/api/v1/audit-logs(?:\\?.*)?$'), (route) => {
    const query = new URL(route.request().url()).searchParams;
    listTenantId = query.get('tenantId');
    traceRequestId = query.get('requestId');
    return route.fulfill({ json: api(pageData([entry])) });
  });
  await page.route(`**/api/v1/audit-logs/${auditId}`, (route) => route.fulfill({ json: api(entry) }));

  await page.goto('/customer/audit-logs');
  await expect.poll(() => listTenantId).toBe(tenantId);
  await expect(page.getByText('Dữ liệu được giới hạn theo công ty đang chọn')).toBeVisible();
  await page.getByRole('button', { name: 'Xem' }).click();
  const detail = page.getByRole('dialog', { name: 'Chi tiết thay đổi' });
  await expect(detail.getByText('profile.title')).toBeVisible();
  await expect(detail.getByText('Staff', { exact: true })).toBeVisible();
  await expect(detail.getByText('Supervisor', { exact: true })).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/02-audit-diff.png`, fullPage: true });
  await detail.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Trace request req-audit-001' }).click();
  await expect.poll(() => traceRequestId).toBe('req-audit-001');
  expect(listTenantId).toBe(tenantId);
  await expect(page.getByText('Đang ở chế độ trace request')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${evidenceDir}/03-tenant-audit-trace.png`, fullPage: true });
});

test('Platform Admin lọc audit toàn hệ thống theo tenant được chọn', async ({ page }) => {
  await seedUser(page, 'PLATFORM_ADMIN', [], null);
  let requestedTenant: string | null = null;
  const automaticAudit = {
    id: 'audit-system-subscription', tenantId: otherTenantId, actorId: null, actorEmail: null,
    entityType: 'TenantSubscription', entityId: otherTenantId, action: 'subscription_updated',
    oldValue: { status: 'ACTIVE' }, newValue: { status: 'EXPIRED' }, requestId: 'cron-subscription-expiration',
    ipAddress: null, userAgent: null, createdAt: '2026-08-07T01:00:00Z',
  };
  await page.route(new RegExp('/api/v1/tenants(?:\\?.*)?$'), (route) => route.fulfill({ json: api(pageData([
    { id: tenantId, name: 'Công ty Alpha', slug: 'alpha', status: 'active', timezone: 'Asia/Ho_Chi_Minh', locale: 'vi', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: otherTenantId, name: 'Công ty Beta', slug: 'beta', status: 'suspended', timezone: 'Asia/Ho_Chi_Minh', locale: 'vi', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  ])) }));
  await page.route(new RegExp('/api/v1/audit-logs(?:\\?.*)?$'), (route) => {
    requestedTenant = new URL(route.request().url()).searchParams.get('tenantId');
    return route.fulfill({ json: api(pageData([automaticAudit])) });
  });

  await page.goto('/admin/audit-logs');
  await expect.poll(() => requestedTenant).toBeNull();
  await expect(page.getByText('Subscription', { exact: true })).toBeVisible();
  await expect(page.getByText('Hệ thống tự động')).toBeVisible();
  await page.getByRole('combobox').first().click();
  await page.locator('.ant-select-dropdown:visible').getByText('Công ty Beta', { exact: true }).click();
  await page.getByRole('button', { name: 'Tìm kiếm' }).click();
  await expect.poll(() => requestedTenant).toBe(otherTenantId);
  await expect(page.getByText('Dữ liệu được giới hạn theo công ty đang chọn')).toHaveCount(0);
});

test('Tenant Operations giữ đúng suspend và hiển thị subscription cùng usage', async ({ page }) => {
  await seedUser(page, 'PLATFORM_ADMIN', [], null);
  let suspendCalled = false;
  const tenant = { id: tenantId, name: 'Công ty Alpha', slug: 'alpha', domain: 'alpha.vn', status: 'active', timezone: 'Asia/Ho_Chi_Minh', locale: 'vi', ownerId: 'owner-1', ownerName: 'Owner', ownerEmail: 'owner@alpha.vn', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
  await page.route(new RegExp('/api/v1/tenants(?:\\?.*)?$'), (route) => route.fulfill({ json: api(pageData([tenant])) }));
  await page.route(`**/api/v1/tenants/${tenantId}/suspend`, (route) => { suspendCalled = true; return route.fulfill({ json: api({ ...tenant, status: 'suspended' }) }); });
  await page.route(`**/api/v1/tenants/${tenantId}/detail`, (route) => route.fulfill({ json: api({
    ...tenant, planName: 'pro', planDisplayName: 'Pro', subscriptionStatus: 'ACTIVE', billingCycle: 'MONTHLY',
    subscriptionStartedAt: '2026-01-01T00:00:00Z', subscriptionExpiresAt: '2027-01-01T00:00:00Z',
    maxEmployees: 100, maxSites: 10, maxStorageGb: 50, maxRandomChecksPerMonth: 1000,
    currentEmployeeCount: 80, currentSiteCount: 7, currentMonthRandomChecks: 600,
  }) }));

  await page.goto('/admin/tenants');
  await page.getByRole('row', { name: /Công ty Alpha/ }).getByRole('button').click();
  await page.getByText('Đình chỉ', { exact: true }).click();
  await page.getByRole('dialog', { name: 'Xác nhận đình chỉ' }).getByRole('button', { name: 'Đình chỉ' }).click();
  await expect.poll(() => suspendCalled).toBe(true);
  await page.goto(`/admin/tenants/${tenantId}`);
  await expect(page.getByText('80 / 100')).toBeVisible();
  await expect(page.getByText('600 / 1.000')).toBeVisible();
  await expect(page.getByText('Pro', { exact: true })).toBeVisible();
  await expect(page.getByText('ACTIVE', { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: `${evidenceDir}/04-tenant-operations-usage.png`, fullPage: true });
});
