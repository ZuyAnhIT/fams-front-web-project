import RoleGuard from "@/components/guards/RoleGuard";
import { ScheduledChecksPage } from "@/features/customer/random-check/components/ScheduledChecksPage";

export const metadata = {
  title: "Lịch kiểm tra ngẫu nhiên | FAMS",
};

export default function RandomChecksPage() {
  return (
    <RoleGuard allowedPermissions={["randomchecks:list", "randomchecks:configure"]}>
      <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
        <ScheduledChecksPage />
      </Suspense>
    </RoleGuard>
  );
}
import { Suspense } from "react";
