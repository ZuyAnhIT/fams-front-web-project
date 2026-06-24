"use client";

import { useState } from "react";
import { Plus, Edit2, Settings2, ShieldAlert } from "lucide-react";
import { Switch, message, Tag } from "antd";
import BaseButton from "@/components/ui/BaseButton";
import GlassCard from "@/components/ui/GlassCard";
import { usePlans, useUpdatePlan } from "../hooks/use-subscription";
import type { PlanResponse } from "../types/subscription.type";
import PlanFormModal from "./PlanFormModal";
import PlanLimitsDrawer from "./PlanLimitsDrawer";

export default function PlanListPage() {
  const { data: plans, isLoading, error } = usePlans(false); // fetch all plans including inactive
  const { mutate: updatePlan } = useUpdatePlan();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isLimitsDrawerOpen, setIsLimitsDrawerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanResponse | null>(null);

  const handleEditPlan = (plan: PlanResponse) => {
    setSelectedPlan(plan);
    setIsFormModalOpen(true);
  };

  const handleConfigLimits = (plan: PlanResponse) => {
    setSelectedPlan(plan);
    setIsLimitsDrawerOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedPlan(null);
    setIsFormModalOpen(true);
  };

  const handleToggleActive = (plan: PlanResponse, checked: boolean) => {
    updatePlan(
      { id: plan.id, payload: { isActive: checked } },
      {
        onSuccess: () => message.success(`Đã ${checked ? 'bật' : 'tắt'} gói ${plan.name}`),
        onError: () => message.error("Cập nhật thất bại"),
      }
    );
  };

  if (error && (error as { response?: { status?: number } }).response?.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-rose-50/50 rounded-2xl border border-rose-100">
        <ShieldAlert className="h-12 w-12 text-rose-300 mb-4" />
        <h2 className="text-xl font-bold text-rose-800 mb-2">Không có quyền truy cập</h2>
        <p className="text-rose-600 max-w-md">
          Chức năng Quản lý Gói dịch vụ (Subscription Plans) chỉ dành cho Platform Admin.
          Vui lòng liên hệ quản trị viên hệ thống nếu bạn cần truy cập.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-brand-600">
            Cấu hình các gói dịch vụ (SaaS) hiển thị cho các công ty đăng ký.
          </p>
        </div>
        <BaseButton
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={handleCreateNew}
          className="!bg-blue-600 !text-white hover:!bg-blue-700 shadow-md border-0 px-5"
        >
          Thêm gói mới
        </BaseButton>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-96 bg-brand-100 rounded-2xl"></div>
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.sort((a, b) => a.sortOrder - b.sortOrder).map(plan => {
            const isPro = plan.displayName.toLowerCase().includes("pro");

            // Helper để lấy màu theo tên gói
            const n = plan.displayName.toLowerCase();
            let theme = { bg: "bg-brand-50", badge: "from-brand-500 to-brand-700" };
            if (n.includes("trial")) theme = { bg: "bg-green-50", badge: "from-green-400 to-green-600" };
            else if (n.includes("basic")) theme = { bg: "bg-blue-50", badge: "from-blue-400 to-blue-600" };
            else if (n.includes("pro")) theme = { bg: "bg-purple-50", badge: "from-purple-500 to-fuchsia-500" };
            else if (n.includes("enterprise")) theme = { bg: "bg-red-50", badge: "from-red-400 to-red-600" };
            else if (n.includes("vip")) theme = { bg: "bg-yellow-50", badge: "from-yellow-400 to-orange-500" };

            return (
              <div
                key={plan.id}
                className={`flex flex-col relative rounded-2xl bg-white transition-all duration-300
                ${!plan.isActive ? 'opacity-70 grayscale-[50%]' : ''}
                ${isPro ? 'border-2 border-brand-400 shadow-md scale-[1.02] z-10' : 'border border-brand-300 hover:border-brand-400 hover:shadow-lg'}
              `}
              >
                {isPro && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r ${theme.badge} text-white text-xs font-bold rounded-full shadow-md z-20 whitespace-nowrap tracking-wide`}>
                    PHỔ BIẾN NHẤT
                  </div>
                )}

                {!plan.isActive && (
                  <div className="absolute top-4 right-4 z-20">
                    <Tag color="default" className="border-slate-300 bg-slate-100 text-slate-600 font-medium">Ngừng hoạt động</Tag>
                  </div>
                )}

                <div className={`p-6 lg:p-8 border-b border-brand-100/50 flex-1 rounded-t-2xl ${isPro ? theme.bg + '/30' : ''}`}>
                  <h3 className="text-2xl font-extrabold mb-2 text-brand-950">
                    {plan.displayName}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6 min-h-[40px] leading-relaxed">
                    {plan.description || "Không có mô tả"}
                  </p>

                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl font-extrabold text-brand-950">${plan.priceMonthly}</span>
                    <span className="text-sm font-semibold text-slate-500">/tháng</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 font-medium">hoặc ${plan.priceYearly}/năm</div>
                </div>

                <div className="p-6 bg-white rounded-b-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-semibold text-slate-700">Trạng thái (Bật/Tắt)</span>
                    <Switch
                      checked={plan.isActive}
                      onChange={(checked) => handleToggleActive(plan, checked)}
                      className={plan.isActive ? "!bg-green-500" : "bg-slate-300"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <BaseButton
                      icon={<Edit2 className="h-4 w-4" />}
                      onClick={() => handleEditPlan(plan)}
                      className="w-full text-sm font-medium h-10 !bg-purple-600 !border-0 !text-white hover:!bg-purple-700 transition-all shadow-sm"
                    >
                      Sửa đổi
                    </BaseButton>
                    <BaseButton
                      icon={<Settings2 className="h-4 w-4" />}
                      onClick={() => handleConfigLimits(plan)}
                      className="w-full text-sm font-medium h-10 !bg-purple-600 !border-0 !text-white hover:!bg-purple-700 transition-all shadow-sm"
                    >
                      Giới hạn
                    </BaseButton>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-brand-50 rounded-2xl border border-brand-100 border-dashed">
          <p className="text-brand-500 mb-4">Chưa có gói dịch vụ nào được tạo.</p>
          <BaseButton type="primary" onClick={handleCreateNew}>
            Tạo gói dịch vụ đầu tiên
          </BaseButton>
        </div>
      )}

      <PlanFormModal
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialData={selectedPlan}
      />

      <PlanLimitsDrawer
        open={isLimitsDrawerOpen}
        onClose={() => setIsLimitsDrawerOpen(false)}
        plan={selectedPlan}
      />
    </div>
  );
}
