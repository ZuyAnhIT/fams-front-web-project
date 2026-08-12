import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên vai trò"),
  description: z.string().optional().or(z.literal("")),
  permissionIds: z.array(z.string()),
});

export type RoleFormData = z.infer<typeof roleSchema>;
