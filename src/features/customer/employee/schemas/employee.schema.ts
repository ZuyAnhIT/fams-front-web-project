import { z } from "zod";

export const employeeSchema = z.object({
  firstName: z.string().min(1, "Vui lòng nhập tên"),
  lastName: z.string().min(1, "Vui lòng nhập họ"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  employeeCode: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  hiredDate: z.string().optional().or(z.literal("")),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

export const inviteEmployeeSchema = z.object({
  email: z.string().email("Vui lòng nhập email hợp lệ"),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Số điện thoại phải có 7–15 chữ số")
    .optional()
    .or(z.literal("")),
  firstName: z.string().optional().or(z.literal("")),
  lastName: z.string().optional().or(z.literal("")),
  roleId: z.string().optional().or(z.literal("")),
});

export type InviteEmployeeFormData = z.infer<typeof inviteEmployeeSchema>;
