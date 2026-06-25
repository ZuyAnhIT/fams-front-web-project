"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CreditCard, Edit, Plus, AlertCircle, Package } from "lucide-react";
import { Modal, message, Tag, Select, Spin } from "antd";
import { useForm, Controller } from "react-hook-form";
import BaseButton from "@/components/ui/BaseButton";
import { usePlans } from "../hooks/use-subscription";
import { useTenantSubscription, useAssignSubscription, useUpdateSubscription } from "../hooks/use-tenant-subscription";
import type { AssignSubscriptionPayload, UpdateSubscriptionPayload } from "../types/subscription.type";

export default function SubscriptionManager({ tenantId }: { tenantId: string }) {
  const { data: currentSub, isLoading: isLoadingSub } = useTenantSubscription(tenantId);
  const { data: plans = [], isLoading: isLoadingPlans } = usePlans(true);
  
  const { mutateAsync: assignSub, isPending: isAssigning } = useAssignSubscription();
  const { mutateAsync: updateSub, isPending: isUpdating } = useUpdateSubscription();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"assign" | "update">("assign");

  const { control, handleSubmit, reset } = useForm<{
    planId: string;
    billingCycle: "MONTHLY" | "YEARLY";
    status?: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  }>({
    defaultValues: {
      planId: "",
      billingCycle: "MONTHLY",
    },
  });

  const openAssignModal = () => {
    setMode("assign");
    reset({ planId: plans[0]?.id || "", billingCycle: "MONTHLY" });
    setIsModalOpen(true);
  };

  const openUpdateModal = () => {
    setMode("update");
    if (currentSub) {
      reset({
        planId: currentSub.planId,
        billingCycle: currentSub.billingCycle,
        status: currentSub.status,
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (mode === "assign") {
        await assignSub({ tenantId, payload: data as AssignSubscriptionPayload });
        message.success("Gán gói dịch vụ thành công");
      } else {
        await updateSub({ tenantId, payload: data as UpdateSubscriptionPayload });
        message.success("Cập nhật gói dịch vụ thành công");
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  if (isLoadingSub) {
    return (
      <div className="flex justify-center p-12">
        <Spin size="large" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "success";
      case "TRIAL": return "processing";
      case "CANCELLED": return "default";
      case "EXPIRED": return "error";
      default: return "default";
    }
  };

  return (
    <div className="pt-4 max-w-4xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 relative z-10">
          <CreditCard className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-800">
            Gói dịch vụ hiện tại
          </h3>
        </div>

        <div className="relative z-10">
          {!currentSub ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-slate-800 font-bold text-lg mb-2">Chưa có gói dịch vụ</p>
              <p className="text-slate-500 text-sm mb-6 text-center max-w-md">
                Công ty này hiện chưa được gán bất kỳ gói dịch vụ nào. Hãy gán một gói để kích hoạt các tính năng trên hệ thống.
              </p>
              <BaseButton
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={openAssignModal}
                className="!bg-brand-primary !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-primary/25 h-11 px-6 rounded-xl font-bold hover:-translate-y-0.5 transition-all"
              >
                Gán gói dịch vụ
              </BaseButton>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tên gói</p>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-brand-primary" />
                    <p className="font-bold text-slate-900 text-xl">
                      {currentSub.planName || "Đang tải..."}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trạng thái</p>
                  <Tag color={getStatusColor(currentSub.status)} className="text-xs px-2.5 py-1 rounded-md uppercase font-bold border-0">
                    {currentSub.status}
                  </Tag>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Chu kỳ thanh toán</p>
                  <p className="font-semibold text-slate-700 capitalize">
                    {currentSub.billingCycle === "YEARLY" ? "Hàng năm (Yearly)" : "Hàng tháng (Monthly)"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Gia hạn tiếp theo</p>
                  <p className="font-semibold text-slate-700">
                    {currentSub.currentPeriodEnd ? format(new Date(currentSub.currentPeriodEnd), "dd/MM/yyyy HH:mm") : "---"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <BaseButton
                  icon={<Edit className="w-4 h-4" />}
                  onClick={openUpdateModal}
                  className="!bg-white !text-brand-primary border-brand-primary/30 hover:!bg-brand-primary/5 hover:border-brand-primary/50 h-11 px-6 rounded-xl font-semibold transition-all"
                >
                  Thay đổi gói / Trạng thái
                </BaseButton>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                {mode === "assign" ? "Gán gói dịch vụ mới" : "Cập nhật gói dịch vụ"}
              </h2>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
        classNames={{
          content: "!bg-white !rounded-3xl !p-0 overflow-hidden shadow-2xl shadow-indigo-900/10",
          header: "!bg-white border-b border-slate-100 px-8 py-6 m-0",
          body: "!bg-slate-50/50 p-8",
          close: "mt-4 mr-4 hover:!bg-slate-100 !rounded-full transition-colors",
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn gói (Plan)</label>
              <Controller
                name="planId"
                control={control}
                rules={{ required: "Vui lòng chọn gói" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    className="w-full h-11"
                    options={plans.map(p => ({ label: p.displayName || p.name, value: p.id }))}
                    loading={isLoadingPlans}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Chu kỳ thanh toán</label>
              <Controller
                name="billingCycle"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    className="w-full h-11"
                    options={[
                      { label: "Hàng tháng (Monthly)", value: "MONTHLY" },
                      { label: "Hàng năm (Yearly)", value: "YEARLY" },
                    ]}
                  />
                )}
              />
            </div>

            {mode === "update" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Trạng thái</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      className="w-full h-11"
                      options={[
                        { label: "Active (Đang hoạt động)", value: "ACTIVE" },
                        { label: "Trial (Dùng thử)", value: "TRIAL" },
                        { label: "Expired (Đã hết hạn)", value: "EXPIRED" },
                        { label: "Cancelled (Đã hủy)", value: "CANCELLED" },
                      ]}
                    />
                  )}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/60 mt-8">
            <BaseButton 
              onClick={() => setIsModalOpen(false)}
              className="!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-11 px-6 rounded-xl font-semibold transition-all"
            >
              Hủy
            </BaseButton>
            <BaseButton 
              type="primary" 
              htmlType="submit" 
              loading={isAssigning || isUpdating}
              className="!bg-brand-primary !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-primary/25 h-11 px-8 rounded-xl font-bold hover:-translate-y-0.5 transition-all"
            >
              {mode === "assign" ? "Gán gói" : "Lưu thay đổi"}
            </BaseButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
