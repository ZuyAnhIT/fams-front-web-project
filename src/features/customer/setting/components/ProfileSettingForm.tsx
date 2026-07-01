"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { message } from "antd";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useAuthStore } from "@/stores/auth.store";
import { useUpdateProfile } from "@/features/customer/auth/hooks/use-auth";
import { profileSchema, type ProfileFormData } from "../schemas/setting.schema";

export default function ProfileSettingForm() {
  const { user, setAuth, accessToken } = useAuthStore();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      phone: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName || user.email || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const payload = {
        displayName: data.displayName,
        phone: data.phone || undefined,
        avatarUrl: data.avatarUrl !== undefined && data.avatarUrl !== null ? data.avatarUrl : undefined,
      };
      const updatedUser = await updateProfile(payload);
      // Cập nhật lại store, giữ nguyên role và tenantId hiện tại
      const currentRefreshToken = localStorage.getItem("fams_refresh_token") || "";
      const authUser = {
        ...updatedUser,
        role: user?.role,
        tenantId: user?.tenantId,
      };
      setAuth(authUser, accessToken as string, currentRefreshToken);
      message.success("Cập nhật thông tin thành công!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || "Cập nhật thất bại.";
      message.error(errorMessage);
    }
  };

  return (
    <div className="w-full">
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h3 className="text-xl font-semibold text-brand-950">Thông tin cá nhân</h3>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin cá nhân cơ bản của bạn</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full lg:max-w-3xl">
        <FormInput
          control={control}
          name="displayName"
          label="Tên hiển thị"
          labelClassName="text-brand-900"
          placeholder="Nhập tên hiển thị"
          id="profile-display-name"
          error={errors.displayName}
          className="text-brand-900 border-brand-300 focus:border-brand-500 focus:ring-brand-500/20"
        />

        <FormInput
          control={control}
          name="phone"
          label="Số điện thoại"
          labelClassName="text-brand-900"
          placeholder="Nhập số điện thoại"
          id="profile-phone"
          error={errors.phone}
          className="text-brand-900 border-brand-300 focus:border-brand-500 focus:ring-brand-500/20"
        />

        <FormInput
          control={control}
          name="avatarUrl"
          label="Đường dẫn ảnh đại diện (URL)"
          labelClassName="text-brand-900"
          placeholder="https://example.com/avatar.jpg"
          id="profile-avatar"
          error={errors.avatarUrl}
          className="text-brand-900 border-brand-300 focus:border-brand-500 focus:ring-brand-500/20"
        />

        <div className="flex justify-start pt-4">
          <BaseButton
            type="primary"
            htmlType="submit"
            loading={isPending}
            className="bg-brand-600 hover:bg-brand-700 text-white border-transparent"
          >
            Lưu thay đổi
          </BaseButton>
        </div>
      </form>
    </div>
  );
}
