"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CreditCard, Edit, Plus, AlertCircle } from "lucide-react";
import { Modal, message, Tag, Select, Spin } from "antd";
import { useForm, Controller } from "react-hook-form";
import GlassCard from "@/components/ui/GlassCard";
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <GlassCard className="p-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-[100px] opacity-70 -z-10"></div>
        <CreditCard className="absolute top-6 right-6 w-12 h-12 text-purple-300 opacity-50 -z-10" />

        <h3 className="text-lg font-semibold text-brand-900 mb-6 flex items-center gap-2">
          Gói dịch vụ hiện tại
        </h3>

        {!currentSub ? (
          <div className="flex flex-col items-center justify-center p-8 bg-yellow-50/50 rounded-xl border border-dashed border-yellow-200">
            <AlertCircle className="w-12 h-12 text-yellow-500 mb-3 drop-shadow-sm" />
            <p className="text-yellow-800 font-medium mb-1">Chưa có gói dịch vụ</p>
            <p className="text-yellow-600/80 text-sm mb-5 text-center">Công ty này hiện chưa được gán bất kỳ gói dịch vụ nào. Hãy gán một gói để kích hoạt các tính năng.</p>
            <BaseButton
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={openAssignModal}
              className="bg-blue-600 hover:!bg-blue-700 shadow-md shadow-blue-200 border-0"
            >
              Gán gói dịch vụ
            </BaseButton>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-brand-500 mb-1">Tên gói</p>
                <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-600 text-xl drop-shadow-sm">
                  {currentSub.planName || "Đang tải..."}
                </p>
              </div>
              <div>
                <p className="text-sm text-brand-500 mb-1">Trạng thái</p>
                <Tag color={getStatusColor(currentSub.status)} className="text-sm px-2 py-0.5 uppercase font-medium">
                  {currentSub.status}
                </Tag>
              </div>
              <div>
                <p className="text-sm text-brand-500 mb-1">Chu kỳ thanh toán</p>
                <p className="font-medium text-brand-700 capitalize">
                  {currentSub.billingCycle === "YEARLY" ? "Hàng năm" : "Hàng tháng"}
                </p>
              </div>
              <div>
                <p className="text-sm text-brand-500 mb-1">Gia hạn tiếp theo</p>
                <p className="font-medium text-brand-700">
                  {currentSub.currentPeriodEnd ? format(new Date(currentSub.currentPeriodEnd), "dd/MM/yyyy HH:mm") : "---"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-100 flex justify-end">
              <BaseButton
                icon={<Edit className="w-4 h-4 text-blue-600" />}
                onClick={openUpdateModal}
                className="border-blue-200 text-blue-700 hover:!text-blue-800 hover:!border-blue-400 hover:bg-blue-50"
              >
                Thay đổi gói / Trạng thái
              </BaseButton>
            </div>
          </div>
        )}
      </GlassCard>

      <Modal
        title={mode === "assign" ? "Gán gói dịch vụ mới" : "Cập nhật gói dịch vụ"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1">Chọn gói (Plan)</label>
            <Controller
              name="planId"
              control={control}
              rules={{ required: "Vui lòng chọn gói" }}
              render={({ field }) => (
                <Select
                  {...field}
                  className="w-full h-10"
                  options={plans.map(p => ({ label: p.displayName || p.name, value: p.id }))}
                  loading={isLoadingPlans}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1">Chu kỳ thanh toán</label>
            <Controller
              name="billingCycle"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  className="w-full h-10"
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
              <label className="block text-sm font-medium text-brand-700 mb-1">Trạng thái</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    className="w-full h-10"
                    options={[
                      { label: "Active", value: "ACTIVE" },
                      { label: "Trial", value: "TRIAL" },
                      { label: "Expired", value: "EXPIRED" },
                      { label: "Cancelled", value: "CANCELLED" },
                    ]}
                  />
                )}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-100 mt-6">
            <BaseButton onClick={() => setIsModalOpen(false)}>Hủy</BaseButton>
            <BaseButton type="primary" htmlType="submit" className="bg-brand-600" loading={isAssigning || isUpdating}>
              {mode === "assign" ? "Gán gói" : "Lưu thay đổi"}
            </BaseButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
