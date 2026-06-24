import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().min(1, "Tên hiển thị không được để trống").max(100, "Tên hiển thị tối đa 100 ký tự"),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, "Số điện thoại không hợp lệ. Vui lòng nhập mã quốc gia (VD: +84912345678)").or(z.literal("")).optional().nullable(),
  avatarUrl: z.string().url("URL ảnh không hợp lệ").or(z.literal("")).optional().nullable(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
