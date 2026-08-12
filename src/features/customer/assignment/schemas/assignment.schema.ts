import { z } from "zod";
import dayjs, { type Dayjs } from "dayjs";

export const assignmentSchema = z.object({
  employeeId: z.string().min(1, "Vui lòng chọn nhân viên"),
  shiftId: z.string().optional().nullable(),
  role: z.enum(["worker", "supervisor"], "Vui lòng chọn vai trò"),
  startDate: z.custom<Dayjs>((value) => dayjs.isDayjs(value), "Vui lòng chọn ngày bắt đầu"),
  endDate: z.custom<Dayjs>((value) => dayjs.isDayjs(value)).optional().nullable(),
  daysOfWeek: z
    .array(
      z.enum([
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ]),
    )
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
}).superRefine((data, context) => {
  if (
    data.startDate &&
    data.endDate &&
    data.endDate.isBefore(data.startDate, "day")
  ) {
    context.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "Ngày kết thúc không được trước ngày bắt đầu",
    });
  }
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;
