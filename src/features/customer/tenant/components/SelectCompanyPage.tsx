"use client";

import { useState } from "react";
import { App, Spin } from "antd";
import { Building2, Check, Plus } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { CUSTOMER_ROUTES } from "@/constants/routes";
import { useMyMemberships } from "../hooks/use-my-memberships";
import { useTenantSessionSwitch } from "../hooks/use-tenant-session-switch";
import CreateCompanyForm from "./CreateCompanyForm";

const ROLE_LABELS: Record<string, string> = {
  PLATFORM_ADMIN: "Quản trị nền tảng",
  TENANT_ADMIN: "Quản trị công ty",
  HR_MANAGER: "Quản lý nhân sự",
  SITE_SUPERVISOR: "Giám sát công trình",
  EMPLOYEE: "Nhân viên",
};

/**
 * Issue #3 (docs/issues/ISSUES.md): landing page for a multi-tenant user to pick which
 * company to work in, or create a new one. Reachable from the header's company switcher
 * ("Tạo công ty mới") and also the natural place to send a user with zero memberships yet.
 */
export default function SelectCompanyPage() {
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const { data: memberships, isLoading, refetch } = useMyMemberships();
  const { switchTenantSession } = useTenantSessionSwitch();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSelect = async (tenantId: string) => {
    setSwitchingTo(tenantId);
    try {
      await switchTenantSession(tenantId);

      window.location.assign(CUSTOMER_ROUTES.DASHBOARD);
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status?: number;
          data?: { userMessage?: string; message?: string };
        };
      };
      if (err.response?.status === 403) {
        await refetch();
        message.warning(
          "Vai trò của bạn tại công ty này không còn hiệu lực. Danh sách đã được cập nhật.",
        );
      } else {
        message.error(
          err.response?.data?.userMessage ||
            err.response?.data?.message ||
            (error instanceof Error ? error.message : undefined) ||
            "Không thể chọn công ty này.",
        );
      }
      setSwitchingTo(null);
    }
  };

  const hasMemberships = (memberships?.length ?? 0) > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10">
          <Building2 className="h-7 w-7 text-blue-600" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chọn công ty làm việc</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {hasMemberships
            ? "Chọn một công ty bên dưới hoặc tạo công ty mới."
            : "Bạn chưa thuộc công ty nào — hãy tạo một công ty mới để bắt đầu."}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-3">
          {memberships?.map((m) => (
            <button
              key={m.tenantId}
              type="button"
              onClick={() => void handleSelect(m.tenantId)}
              disabled={switchingTo !== null}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md disabled:opacity-60"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <Building2 className="h-5 w-5 text-slate-500" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{m.tenantName || m.tenantId}</p>
                  <p className="text-xs text-slate-500">
                    {m.roleNames
                      .map((role) => ROLE_LABELS[role] || role)
                      .join(" · ")}
                  </p>
                </div>
              </div>
              {m.tenantId === user?.tenantId ? (
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600">
                  <Check className="h-4 w-4" aria-hidden="true" /> Đang chọn
                </span>
              ) : switchingTo === m.tenantId ? (
                <Spin size="small" />
              ) : null}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        {showCreateForm ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Tạo công ty mới</h2>
            <CreateCompanyForm onCreated={() => setShowCreateForm(false)} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-5 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo công ty mới
          </button>
        )}
      </div>
    </div>
  );
}
