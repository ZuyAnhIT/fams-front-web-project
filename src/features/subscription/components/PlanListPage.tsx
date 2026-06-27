"use client";

import { useState } from "react";
import { Plus, Edit2, Settings2, ShieldAlert, Star } from "lucide-react";
import { Switch, App, Tag, Pagination } from "antd";
import BaseButton from "@/components/ui/BaseButton";
import { usePagination } from "@/hooks/usePagination";
import { usePlans, useUpdatePlan } from "../hooks/use-subscription";
import type { PlanResponse } from "../types/subscription.type";
import PlanFormModal from "./PlanFormModal";
import PlanLimitsDrawer from "./PlanLimitsDrawer";

export default function PlanListPage() {
  const { state, setPagination } = usePagination(8);
  const { message } = App.useApp();
  const { data: plansData, isLoading, error } = usePlans(false, state);
  const plans = Array.isArray(plansData) ? plansData : (plansData?.content || []);
  const totalElements = Array.isArray(plansData) ? plans.length : (plansData?.totalElements || 0);
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-rose-50/50 rounded-3xl border border-rose-100 backdrop-blur-sm">
        <ShieldAlert className="h-14 w-14 text-rose-400 mb-5 drop-shadow-sm" />
        <h2 className="text-2xl font-bold text-rose-900 mb-2 tracking-tight">Không có quyền truy cập</h2>
        <p className="text-rose-600/90 max-w-md leading-relaxed">
          Chức năng Quản lý Gói dịch vụ (Subscription Plans) chỉ dành cho Platform Admin.
          Vui lòng liên hệ quản trị viên hệ thống nếu bạn cần truy cập.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Cấu hình Gói dịch vụ
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Thiết lập giá và giới hạn tính năng cho các gói SaaS.
          </p>
        </div>
        <BaseButton
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={handleCreateNew}
          className="!bg-slate-900 !text-white hover:!bg-slate-800 shadow-md shadow-slate-900/10 border-0 px-6 h-10 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
        >
          Thêm gói mới
        </BaseButton>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[420px] bg-slate-100 rounded-3xl border border-slate-200"></div>
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-0 pt-4">
          {[...plans].sort((a, b) => a.sortOrder - b.sortOrder).map(plan => {
            const isPro = plan.displayName.toLowerCase().includes("pro");

            return (
              <div
                key={plan.id}
                className={`flex flex-col relative rounded-3xl bg-white/80 backdrop-blur-xl transition-all duration-300
                ${!plan.isActive ? 'opacity-60 grayscale-[40%]' : ''}
                ${isPro ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/15 scale-[1.03] z-10' : 'ring-1 ring-slate-200/80 hover:ring-slate-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1'}
              `}
              >
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-[11px] font-black rounded-full shadow-lg shadow-blue-500/30 z-20 whitespace-nowrap tracking-widest uppercase flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-white" /> PHỔ BIẾN NHẤT
                  </div>
                )}

                {!plan.isActive && (
                  <div className="absolute top-5 right-5 z-20">
                    <Tag color="default" className="border-slate-200 bg-white/90 backdrop-blur text-slate-500 font-semibold rounded-full px-3 py-0.5 shadow-sm">Tạm dừng</Tag>
                  </div>
                )}

                <div className={`p-8 border-b border-slate-100/80 flex-1 rounded-t-3xl ${isPro ? 'bg-gradient-to-b from-blue-50/40 to-transparent' : ''}`}>
                  <h3 className={`text-2xl font-bold tracking-tight mb-2 ${isPro ? 'text-blue-900' : 'text-slate-900'}`}>
                    {plan.displayName}
                  </h3>
                  <p className="text-sm text-slate-500 mb-8 min-h-[44px] leading-relaxed font-medium">
                    {plan.description || "Gói dịch vụ mặc định."}
                  </p>

                  <div className="flex items-end gap-1 mt-4">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">${plan.priceMonthly}</span>
                    <span className="text-sm font-bold text-slate-400 mb-1">/tháng</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 font-medium">
                    Thanh toán hàng năm: <span className="text-slate-700 font-bold">${plan.priceYearly}</span>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/50 rounded-b-3xl flex flex-col gap-5">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-slate-600">Trạng thái (Bật/Tắt)</span>
                    <Switch
                      checked={plan.isActive}
                      onChange={(checked) => handleToggleActive(plan, checked)}
                      className={plan.isActive ? "!bg-green-500" : "bg-slate-300"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <BaseButton
                      icon={<Edit2 className="h-4 w-4" />}
                      onClick={() => handleEditPlan(plan)}
                      className="w-full text-sm font-bold h-11 !bg-white !border-slate-200 !text-slate-700 hover:!border-blue-400 hover:!text-blue-600 transition-all shadow-sm rounded-xl cursor-pointer"
                    >
                      Sửa
                    </BaseButton>
                    <BaseButton
                      icon={<Settings2 className="h-4 w-4" />}
                      onClick={() => handleConfigLimits(plan)}
                      className={`w-full text-sm font-bold h-11 !border-0 !text-white transition-all shadow-md rounded-xl cursor-pointer
                        ${isPro ? '!bg-blue-600 hover:!bg-blue-700 shadow-blue-600/20' : '!bg-slate-900 hover:!bg-slate-800 shadow-slate-900/20'}
                      `}
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
        <div className="text-center py-24 bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200 border-dashed">
          <p className="text-slate-500 mb-6 font-medium">Chưa có gói dịch vụ nào được tạo trong hệ thống.</p>
          <BaseButton 
            type="primary" 
            onClick={handleCreateNew}
            className="!bg-slate-900 !text-white hover:!bg-slate-800 shadow-md border-0 px-6 h-10 rounded-xl font-semibold"
          >
            Tạo gói dịch vụ đầu tiên
          </BaseButton>
        </div>
      )}

      {plansData && totalElements > 0 && (
        <div className="flex justify-end mt-4">
          <Pagination
            current={state.page + 1}
            pageSize={state.size}
            total={totalElements}
            onChange={(page, pageSize) => setPagination({ page: page - 1, size: pageSize })}
            showSizeChanger
            showTotal={(total) => `Tổng số ${total} gói`}
          />
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
