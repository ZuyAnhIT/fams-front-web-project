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
  ownerUserId: z.uuid("Vui lòng chọn một tài khoản chủ sở hữu hợp lệ"),
});

export type CreateTenantFormData = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z.object({
  name: z.string().min(2, "Tên công ty phải từ 2-255 ký tự").max(255, "Tên công ty tối đa 255 ký tự").optional().or(z.literal("")),
  logoUrl: z.string().url("URL không hợp lệ").max(2048, "URL tối đa 2048 ký tự").optional().or(z.literal("")),
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

const hexColor = z.string()
  .regex(/^#(?:[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Màu phải đúng định dạng Hex, ví dụ #2563EB")
  .optional()
  .or(z.literal(""));

export const updateTenantSettingsSchema = z.object({
  dateFormat: z.string().min(1, "Vui lòng chọn định dạng ngày").max(30),
  timeFormat: z.string().min(1, "Vui lòng chọn định dạng giờ").max(20),
  brandPrimaryColor: hexColor,
  brandSecondaryColor: hexColor,
  brandAccentColor: hexColor,
  employeeCodePrefix: z.string()
    .max(20, "Tiền tố tối đa 20 ký tự")
    .regex(/^[A-Za-z0-9-]*$/, "Chỉ dùng chữ, số và dấu gạch ngang")
    .optional()
    .or(z.literal("")),
  employeeCodePadding: z.coerce.number().int().min(1).max(8),
});

export type UpdateTenantSettingsFormData = z.infer<typeof updateTenantSettingsSchema>;

export const createIpWhitelistSchema = z.object({
  ipAddress: z.string().min(1, "Vui lòng nhập địa chỉ IP/CIDR"),
  label: z.string().max(100, "Nhãn tối đa 100 ký tự").optional().or(z.literal("")),
  scope: z.enum(["all", "web_admin", "api"]),
});

export type CreateIpWhitelistFormData = z.infer<typeof createIpWhitelistSchema>;
