import RoleGuard from "@/components/guards/RoleGuard";
import { ScheduledChecksPage } from "@/features/customer/random-check/components/ScheduledChecksPage";

export const metadata = {
  title: "Lịch kiểm tra ngẫu nhiên | FAMS",
};

export default function RandomChecksPage() {
  return (
    <RoleGuard allowedPermissions={["randomchecks:list", "randomchecks:configure"]}>
      <ScheduledChecksPage />
    </RoleGuard>
  );
}
