"use client";

import { useState } from "react";
import { Plus, Edit2, Settings2, ShieldAlert, Star } from "lucide-react";
import { Switch, App, Tag, Modal, Alert, Segmented } from "antd";
import BaseButton from "@/components/ui/BaseButton";
import BaseSelect from "@/components/ui/BaseSelect";
import { usePagination } from "@/hooks/usePagination";
import { usePlans, useUpdatePlan } from "../hooks/use-subscription";
import type { PlanResponse } from "../types/subscription.type";
import PlanFormModal from "./PlanFormModal";
import PlanLimitsDrawer from "./PlanLimitsDrawer";

export default function PlanListPage() {
  const { state } = usePagination(50);
  const { message } = App.useApp();
  const { data: plansData, isLoading, error } = usePlans(false, state);
  const plans = Array.isArray(plansData) ? plansData : (plansData?.content || []);
  const { mutateAsync: updatePlan, isPending: isUpdatingPlan } = useUpdatePlan();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isLimitsDrawerOpen, setIsLimitsDrawerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanResponse | null>(null);
  const [planToDeactivate, setPlanToDeactivate] = useState<PlanResponse | null>(null);
  const [migrateToPlanId, setMigrateToPlanId] = useState<string>();
  const [planView, setPlanView] = useState<"catalog" | "all">("catalog");

  const isWholeVnd = (value: number) => Number.isSafeInteger(value) && value >= 0;
  const isCatalogPlan = (plan: PlanResponse) => plan.isActive
    && isWholeVnd(plan.priceMonthly)
    && isWholeVnd(plan.priceYearly)
    && (plan.name === "trial" || (plan.priceMonthly > 0 && plan.priceYearly > 0));
  const visiblePlans = planView === "catalog" ? plans.filter(isCatalogPlan) : plans;
  const nonCatalogCount = plans.length - plans.filter(isCatalogPlan).length;

  const money = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

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

  const handleToggleActive = async (plan: PlanResponse, checked: boolean) => {
    if (!checked) {
      setPlanToDeactivate(plan);
      setMigrateToPlanId(undefined);
      return;
    }
    try {
      await updatePlan({ id: plan.id, payload: { isActive: true } });
      message.success(`Đã bật gói ${plan.name}`);
    } catch (updateError: unknown) {
      const response = (updateError as { response?: { data?: { userMessage?: string; message?: string } } }).response;
      message.error(response?.data?.userMessage || response?.data?.message || "Không thể bật gói.");
    }
  };

  const confirmDeactivate = async () => {
    if (!planToDeactivate) return;
    try {
      await updatePlan({
        id: planToDeactivate.id,
        payload: {
          isActive: false,
          ...(migrateToPlanId ? { migrateToPlanId } : {}),
        },
      });
      message.success(`Đã tắt gói ${planToDeactivate.name}`);
      setPlanToDeactivate(null);
    } catch (updateError: unknown) {
      const response = (updateError as { response?: { data?: { userMessage?: string; message?: string } } }).response;
      message.error(response?.data?.userMessage || response?.data?.message || "Không thể tắt gói.");
    }
  };

  if (error && (error as { response?: { status?: number } }).response?.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-rose-50/50 rounded-3xl border border-rose-100 backdrop-blur-sm">
        <ShieldAlert className="h-14 w-14 text-rose-400 mb-5 drop-shadow-sm" />
        <h2 className="text-2xl font-bold text-rose-900 mb-2 tracking-tight">Không có quyền truy cập</h2>
        <p className="text-rose-600/90 max-w-md leading-relaxed">
          Xin lỗi, bạn không có quyền truy cập vào trang này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Cấu hình Gói dịch vụ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập giá VND và giới hạn tính năng cho các gói SaaS.
          </p>
        </div>
        <BaseButton
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={handleCreateNew}
          className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-10 px-5 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          Thêm gói mới
        </BaseButton>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-800">Phạm vi hiển thị</p>
          <p className="text-sm text-slate-500">
            Danh mục thanh toán chỉ gồm các gói đang bán với giá VND hợp lệ.
          </p>
        </div>
        <Segmented
          value={planView}
          onChange={(value) => setPlanView(value as "catalog" | "all")}
          options={[
            { label: `Đang bán (${plans.filter(isCatalogPlan).length})`, value: "catalog" },
            { label: `Tất cả dữ liệu (${plans.length})`, value: "all" },
          ]}
        />
      </div>

      {planView === "all" && nonCatalogCount > 0 && (
        <Alert
          showIcon
          type="info"
          title={`${nonCatalogCount} gói không xuất hiện ở trang thanh toán`}
          description="Nhóm này gồm gói tạm dừng, gói miễn phí nội bộ hoặc dữ liệu kiểm thử/giá cũ không phải số VND nguyên. Chúng được giữ để quản trị và đối chiếu lịch sử."
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[420px] bg-slate-100 rounded-[10px] border border-slate-200"></div>
          ))}
        </div>
      ) : visiblePlans.length > 0 ? (
        <div className="relative z-0 grid grid-cols-1 gap-5 pt-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[...visiblePlans].sort((a, b) => a.sortOrder - b.sortOrder).map(plan => {
            const isPro = plan.name === "pro";
            const hasValidVndPrice = isWholeVnd(plan.priceMonthly) && isWholeVnd(plan.priceYearly);

            return (
              <div
                key={plan.id}
                className={`flex flex-col relative rounded-[10px] bg-white transition-all duration-300
                ${!plan.isActive ? 'opacity-60 grayscale-[40%]' : ''}
                ${isPro ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/15 scale-[1.03] z-10' : 'ring-1 ring-slate-300 shadow-xl shadow-slate-300/70 hover:ring-slate-400 hover:shadow-2xl hover:shadow-slate-400/80 hover:-translate-y-1'}
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

                {plan.isActive && !isCatalogPlan(plan) && (
                  <div className="absolute top-5 right-5 z-20">
                    <Tag color="warning" className="rounded-full px-3 py-0.5 font-semibold">Chưa thể thanh toán</Tag>
                  </div>
                )}

                <div className={`p-8 border-b border-slate-100/80 flex-1 rounded-t-[20px] ${isPro ? 'bg-gradient-to-b from-blue-50/40 to-transparent' : ''}`}>
                  <h3 className={`text-2xl font-bold tracking-tight mb-2 ${isPro ? 'text-blue-900' : 'text-slate-900'}`}>
                    {plan.displayName}
                  </h3>
                  <p className="text-sm text-slate-500 mb-8 min-h-[44px] leading-relaxed font-medium">
                    {plan.description || "Gói dịch vụ mặc định."}
                  </p>

                  <div className="flex items-end gap-1 mt-4">
                    <span className="text-4xl font-bold text-slate-900 tracking-tight">
                      {plan.priceMonthly === 0 ? "Miễn phí" : money.format(plan.priceMonthly)}
                    </span>
                    <span className="text-sm font-semibold text-slate-400 mb-1">/tháng</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 font-medium">
                    Thanh toán hàng năm:{" "}
                    <span className="text-slate-700 font-bold">
                      {plan.priceYearly === 0 ? "Miễn phí" : money.format(plan.priceYearly)}
                    </span>
                  </div>
                  {!hasValidVndPrice && (
                    <p className="mt-3 text-xs font-semibold text-amber-700">Giá cũ có phần thập phân, cần sửa thành số VND nguyên.</p>
                  )}
                </div>

                <div className="p-6 bg-slate-50/50 rounded-b-[20px] flex flex-col gap-5">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-slate-600">Trạng thái (Bật/Tắt)</span>
                    <Switch
                      aria-label={`Bật hoặc tắt gói ${plan.displayName}`}
                      checked={plan.isActive}
                      loading={isUpdatingPlan}
                      onChange={(checked) => void handleToggleActive(plan, checked)}
                      className={plan.isActive ? "!bg-green-500" : "bg-slate-300"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <BaseButton
                      icon={<Edit2 className="h-4 w-4" />}
                      onClick={() => handleEditPlan(plan)}
                      className={`w-full text-sm font-bold h-11 !border-0 transition-all shadow-sm cursor-pointer
                        ${isPro ? '!bg-gradient-to-r !from-blue-500 !to-cyan-600 !text-white hover:!from-blue-600 hover:!to-cyan-700' : '!bg-[#343634] !text-white hover:!bg-[#232423]'}
                      `}
                    >
                      Sửa
                    </BaseButton>
                    <BaseButton
                      icon={<Settings2 className="h-4 w-4" />}
                      onClick={() => handleConfigLimits(plan)}
                      className={`w-full text-sm font-bold h-11 !border-0 transition-all shadow-sm cursor-pointer
                        ${isPro ? '!bg-gradient-to-r !from-blue-500 !to-cyan-600 !text-white hover:!from-blue-600 hover:!to-cyan-700' : '!bg-[#343634] !text-white hover:!bg-[#232423]'}
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
        <div className="text-center py-24 bg-white/60 backdrop-blur-sm rounded-[20px] border border-slate-200 border-dashed">
          <p className="text-slate-500 mb-6 font-medium">
            {planView === "catalog" ? "Chưa có gói nào đủ điều kiện mở bán." : "Chưa có gói dịch vụ nào trong hệ thống."}
          </p>
          <BaseButton
            type="primary"
            onClick={handleCreateNew}
            className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-10 px-5 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
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

      <Modal
        title={`Tắt gói ${planToDeactivate?.displayName || ""}`}
        open={Boolean(planToDeactivate)}
        onCancel={() => setPlanToDeactivate(null)}
        onOk={() => void confirmDeactivate()}
        okText="Xác nhận tắt gói"
        cancelText="Hủy"
        confirmLoading={isUpdatingPlan}
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-4 py-2">
          <Alert
            showIcon
            type="warning"
            title="Kiểm tra tenant đang sử dụng gói"
            description="Nếu còn tenant đang dùng gói này, backend yêu cầu chọn gói đích để chuyển an toàn. Việc chuyển có thể bị chặn nếu tenant vượt giới hạn của gói đích."
          />
          <div>
            <label htmlFor="migration-plan" className="mb-2 block text-sm font-semibold text-slate-700">
              Chuyển tenant sang gói khác (nếu cần)
            </label>
            <BaseSelect
              id="migration-plan"
              aria-label="Gói đích để chuyển tenant"
              allowClear
              value={migrateToPlanId}
              onChange={(value) => setMigrateToPlanId(value)}
              placeholder="Không chuyển — chỉ hợp lệ khi chưa có tenant sử dụng"
              options={plans
                .filter((plan) => plan.isActive && plan.id !== planToDeactivate?.id)
                .map((plan) => ({ value: plan.id, label: plan.displayName || plan.name }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
