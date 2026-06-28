const fs = require('fs');
const path = require('path');

const rolesMapping = {
  'tenants': ['SystemRole.PLATFORM_ADMIN'],
  'employees': ['SystemRole.TENANT_ADMIN', 'SystemRole.HR_MANAGER', 'SystemRole.SITE_SUPERVISOR', 'SystemRole.PLATFORM_ADMIN'],
  'attendance': ['SystemRole.TENANT_ADMIN', 'SystemRole.HR_MANAGER', 'SystemRole.SITE_SUPERVISOR', 'SystemRole.PLATFORM_ADMIN'],
  'shifts': ['SystemRole.TENANT_ADMIN', 'SystemRole.HR_MANAGER', 'SystemRole.PLATFORM_ADMIN'],
  'sites': ['SystemRole.TENANT_ADMIN', 'SystemRole.SITE_SUPERVISOR', 'SystemRole.PLATFORM_ADMIN'],
  'assignments': ['SystemRole.TENANT_ADMIN', 'SystemRole.HR_MANAGER', 'SystemRole.PLATFORM_ADMIN'],
  'violations': ['SystemRole.TENANT_ADMIN', 'SystemRole.HR_MANAGER', 'SystemRole.SITE_SUPERVISOR', 'SystemRole.PLATFORM_ADMIN'],
  'random-checks': ['SystemRole.TENANT_ADMIN', 'SystemRole.SITE_SUPERVISOR', 'SystemRole.PLATFORM_ADMIN'],
  'reports': ['SystemRole.TENANT_ADMIN', 'SystemRole.HR_MANAGER', 'SystemRole.PLATFORM_ADMIN'],
  'settings/tenant': ['SystemRole.TENANT_ADMIN'],
  'settings/roles': ['SystemRole.TENANT_ADMIN', 'SystemRole.PLATFORM_ADMIN'],
};

const basePath = path.join(__dirname, 'src', 'app', '(dashboard)');

for (const [route, roles] of Object.entries(rolesMapping)) {
  const pagePath = path.join(basePath, ...route.split('/'), 'page.tsx');
  if (!fs.existsSync(pagePath)) {
    console.log(`File not found: ${pagePath}`);
    continue;
  }

  let content = fs.readFileSync(pagePath, 'utf8');

  // Skip if already has RoleGuard
  if (content.includes('RoleGuard')) {
    console.log(`Skipping (already has RoleGuard): ${pagePath}`);
    continue;
  }

  // Add imports
  const importStatement = `import RoleGuard from "@/components/guards/RoleGuard";\nimport { SystemRole } from "@/features/auth/types/auth.type";\n`;
  content = importStatement + content;

  const returnRegex = /return\s*\(\s*([\s\S]*?)\s*\);/;
  const match = content.match(returnRegex);

  if (match) {
    const originalReturnBody = match[1];

    // We need to indent originalReturnBody
    const indentedBody = originalReturnBody.split('\n').map(line => '      ' + line.replace(/^\s*/, '')).join('\n');

    const newReturnBody = `\n    <RoleGuard allowedRoles={[${roles.join(', ')}]}>\n${indentedBody}\n    </RoleGuard>\n  `;
    content = content.replace(returnRegex, `return (${newReturnBody});`);

    fs.writeFileSync(pagePath, content, 'utf8');
    console.log(`Updated: ${pagePath}`);
  } else {
    console.log(`Could not match return statement in: ${pagePath}`);
  }
}
