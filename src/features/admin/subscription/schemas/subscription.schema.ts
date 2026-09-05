import { z } from "zod";

export const planSchema = z.object({
  name: z.string().min(2, "Mã định danh phải từ 2-50 ký tự").max(50).regex(/^[a-z0-9_-]+$/, "Chỉ chứa chữ thường, số, gạch ngang, gạch dưới"),
  displayName: z.string().min(2, "Tên hiển thị phải từ 2-100 ký tự").max(100),
  description: z.string().max(2000, "Mô tả tối đa 2000 ký tự").optional(),
  priceMonthly: z.coerce.number<number>().int("Giá phải là số VND nguyên").min(0, "Giá phải lớn hơn hoặc bằng 0"),
  priceYearly: z.coerce.number<number>().int("Giá phải là số VND nguyên").min(0, "Giá phải lớn hơn hoặc bằng 0"),
  isActive: z.boolean(),
  sortOrder: z.coerce.number<number>(),
});

export type PlanFormData = z.infer<typeof planSchema>;

export const planLimitsSchema = z.object({
  maxEmployees: z.coerce.number<number>().nullable().optional(),
  maxSites: z.coerce.number<number>().nullable().optional(),
  maxStorageGb: z.coerce.number<number>().nullable().optional(),
  maxRandomChecksPerMonth: z.coerce.number<number>().nullable().optional(),
  isUnlimitedEmployees: z.boolean(),
  isUnlimitedSites: z.boolean(),
  isUnlimitedStorage: z.boolean(),
  isUnlimitedChecks: z.boolean(),
});

export type PlanLimitsFormData = z.infer<typeof planLimitsSchema>;
