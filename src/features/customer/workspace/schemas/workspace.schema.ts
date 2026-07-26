import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Tên phòng ban/đội nhóm không được để trống").max(100, "Tên tối đa 100 ký tự"),
  description: z.string().optional(),
  type: z.enum(["department", "team"]).optional(),
  parentId: z.string().optional(),
});

export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Tên phòng ban/đội nhóm không được để trống").max(100, "Tên tối đa 100 ký tự").optional(),
  description: z.string().optional(),
  type: z.enum(["department", "team"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  parentId: z.string().optional(),
  clearParent: z.boolean().optional(),
});

export type UpdateWorkspaceFormData = z.infer<typeof updateWorkspaceSchema>;
