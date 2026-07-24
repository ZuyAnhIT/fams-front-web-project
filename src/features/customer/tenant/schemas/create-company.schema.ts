import { z } from "zod";

/**
 * Issue #3 (docs/issues/ISSUES.md): self-serve company creation — any authenticated user can
 * create a company. Intentionally a smaller field set than the Platform-Admin create-tenant
 * form (`admin/tenant/schemas/tenant.schema.ts`); advanced config (timezone/locale/currency)
 * can be edited later from company settings, matching how most SaaS "create workspace" flows
 * only ask the essentials up front.
 */
export const createCompanySchema = z.object({
  name: z.string().min(2, "Tên công ty phải từ 2-255 ký tự").max(255, "Tên công ty tối đa 255 ký tự"),
  slug: z
    .string()
    .min(2, "Slug phải từ 2-100 ký tự")
    .max(100, "Slug tối đa 100 ký tự")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang"),
  industry: z.string().max(100, "Lĩnh vực tối đa 100 ký tự").optional().or(z.literal("")),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
