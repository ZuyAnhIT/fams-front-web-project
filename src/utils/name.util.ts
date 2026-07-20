/**
 * Format employee name to Vietnamese standard: "Last Name + First Name"
 * 
 * In Vietnamese naming convention:
 * - Database stores: firstName = "Văn", lastName = "Nguyễn"  
 * - Display should be: "Nguyễn Văn" (Họ trước, Tên sau)
 */
export function formatVietnameseName(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim() || "";
  const last = lastName?.trim() || "";
  
  if (!first && !last) return "";
  if (!first) return last;
  if (!last) return first;
  
  return `${last} ${first}`;
}

/**
 * Get display name from employee object (handles both fullName and firstName/lastName)
 */
export function getEmployeeDisplayName(emp: { 
  fullName?: string | null; 
  firstName?: string | null; 
  lastName?: string | null;
}): string {
  if (emp.fullName) return emp.fullName;
  return formatVietnameseName(emp.firstName, emp.lastName);
}
