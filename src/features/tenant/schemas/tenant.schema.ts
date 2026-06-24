import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2, "Tên công ty phải từ 2-255 ký tự").max(255, "Tên công ty tối đa 255 ký tự"),
  slug: z.string()
    .min(2, "Slug phải từ 2-100 ký tự")
    .max(100, "Slug tối đa 100 ký tự")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang"),
  domain: z.string().max(255, "Tên miền tối đa 255 ký tự").optional().or(z.literal("")),
  industry: z.string().max(100, "Lĩnh vực tối đa 100 ký tự").optional().or(z.literal("")),
  countryCode: z.string()
    .regex(/^[A-Z]{2}$/, "Mã quốc gia phải là 2 chữ cái in hoa (VD: VN)")
    .optional()
    .or(z.literal("")),
  timezone: z.string().max(100, "Múi giờ tối đa 100 ký tự").optional().or(z.literal("")),
  locale: z.string().max(10, "Ngôn ngữ tối đa 10 ký tự").optional().or(z.literal("")),
  currencyCode: z.string()
    .regex(/^[A-Z]{3}$/, "Mã tiền tệ phải là 3 chữ cái in hoa (VD: VND)")
    .optional()
    .or(z.literal("")),
});

export type CreateTenantFormData = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z.object({
  name: z.string().min(2, "Tên công ty phải từ 2-255 ký tự").max(255, "Tên công ty tối đa 255 ký tự").optional(),
  domain: z.string().max(255, "Tên miền tối đa 255 ký tự").optional().or(z.literal("")),
  industry: z.string().max(100, "Lĩnh vực tối đa 100 ký tự").optional().or(z.literal("")),
  countryCode: z.string()
    .regex(/^[A-Z]{2}$/, "Mã quốc gia phải là 2 chữ cái in hoa (VD: VN)")
    .optional()
    .or(z.literal("")),
  timezone: z.string().max(100, "Múi giờ tối đa 100 ký tự").optional().or(z.literal("")),
  locale: z.string().max(10, "Ngôn ngữ tối đa 10 ký tự").optional().or(z.literal("")),
  currencyCode: z.string()
    .regex(/^[A-Z]{3}$/, "Mã tiền tệ phải là 3 chữ cái in hoa (VD: VND)")
    .optional()
    .or(z.literal("")),
});

export type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;

export const updateTenantSettingsSchema = z.object({
  dateFormat: z.string().min(1, "Vui lòng chọn định dạng ngày"),
  timeFormat: z.string().min(1, "Vui lòng chọn định dạng giờ"),
  primaryColor: z.string().optional().or(z.literal("")),
});

export type UpdateTenantSettingsFormData = z.infer<typeof updateTenantSettingsSchema>;

export const createIpWhitelistSchema = z.object({
  ipAddress: z.string().min(1, "Vui lòng nhập địa chỉ IP/CIDR"),
  label: z.string().optional().or(z.literal("")),
  scope: z.string().default("global"),
});

export type CreateIpWhitelistFormData = z.infer<typeof createIpWhitelistSchema>;
