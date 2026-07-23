import { redirect } from "next/navigation";
import { CUSTOMER_ROUTES } from "@/constants/routes";

export default function LegacyTenantSettingsPage() {
  redirect(CUSTOMER_ROUTES.TENANT_SETTINGS);
}
