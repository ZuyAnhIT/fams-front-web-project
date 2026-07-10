import { z } from "zod";

export const assignmentSchema = z.object({
  employeeId: z.string().min(1, "Vui lòng chọn nhân viên"),
  shiftId: z.string().optional().nullable(),
  role: z.string().min(1, "Vui lòng chọn vai trò"),
  startDate: z.any().refine((val) => val != null, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.any().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;
