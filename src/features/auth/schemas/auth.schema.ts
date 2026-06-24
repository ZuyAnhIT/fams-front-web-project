import { z } from "zod";

// Regex kiểm tra số điện thoại Việt Nam hợp lệ
const phoneRegex = /^(?:\+84|84|0)[35789]\d{8}$/;

/**
 * Zod schema xác thực form đăng nhập bằng Email.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu"),
  rememberMe: z.boolean(),
});

/** Kiểu dữ liệu infer từ schema */
export type LoginFormData = z.infer<typeof loginSchema>;


/**
 * Zod schema xác thực form đăng ký tài khoản.
 */
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Vui lòng nhập họ và tên")
      .min(2, "Họ và tên phải có ít nhất 2 ký tự")
      .max(100, "Họ và tên không được vượt quá 100 ký tự"),
    emailOrPhone: z
      .string()
      .min(1, "Vui lòng nhập email hoặc số điện thoại")
      .refine(
        (val) => {
          const isEmail = z.string().email().safeParse(val).success;
          const isPhone = phoneRegex.test(val);
          return isEmail || isPhone;
        },
        {
          message: "Email hoặc số điện thoại không hợp lệ",
        }
      ),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu")
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Zod schema xác thực form quên mật khẩu.
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Zod schema xác thực form đăng nhập bằng số điện thoại.
 */
export const phoneLoginSchema = z.object({
  phone: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại")
    .refine(
      (val) => phoneRegex.test(val),
      { message: "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)" }
    ),
});

export type PhoneLoginFormData = z.infer<typeof phoneLoginSchema>;

/**
 * Zod schema xác thực form đặt lại mật khẩu.
 */
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu mới")
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

