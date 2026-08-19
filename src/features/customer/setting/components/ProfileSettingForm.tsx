"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { message, Avatar } from "antd";
import { Camera, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextArea from "@/components/forms/FormTextArea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import BaseButton from "@/components/ui/BaseButton";
import { useAuthStore } from "@/stores/auth.store";
import { useDeleteAvatar, useUpdateProfile, useUploadAvatar } from "@/features/customer/auth/hooks/use-auth";
import type { UserProfile } from "@/features/customer/auth/types/auth.type";
import { profileSchema, type ProfileFormData } from "../schemas/setting.schema";

const GENDER_OPTIONS = [
  { label: "Nam", value: "male" },
  { label: "Nữ", value: "female" },
  { label: "Khác", value: "other" },
];

const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";
const AVATAR_MAX_MB = 5;

export default function ProfileSettingForm() {
  const { user, updateUser } = useAuthStore();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();
  const { mutateAsync: deleteAvatar, isPending: isDeletingAvatar } = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      dateOfBirth: null,
      hometown: "",
      gender: "",
      address: "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName || user.email || "",
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        hometown: user.hometown || "",
        gender: user.gender || "",
        address: user.address || "",
      });
    }
  }, [user, reset]);

  const persistUser = (updatedUser: UserProfile) => {
    updateUser({ ...user, ...updatedUser, role: user?.role, tenantId: user?.tenantId });
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const payload = {
        displayName: data.displayName,
        dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth).format("YYYY-MM-DD") : undefined,
        hometown: data.hometown || undefined,
        gender: data.gender || undefined,
        address: data.address || undefined,
      };
      const updatedUser = await updateProfile(payload);
      persistUser(updatedUser);
      message.success("Cập nhật thông tin thành công!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { userMessage?: string; message?: string } } };
      message.error(err.response?.data?.userMessage || err.response?.data?.message || "Cập nhật thất bại.");
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const updatedUser = await deleteAvatar();
      setAvatarPreview(null);
      persistUser(updatedUser);
      message.success("Đã xóa ảnh đại diện.");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { userMessage?: string; message?: string } } };
      message.error(err.response?.data?.userMessage || err.response?.data?.message || "Xóa ảnh thất bại.");
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      message.error(`Ảnh quá lớn — tối đa ${AVATAR_MAX_MB}MB.`);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      message.error("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WEBP.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    try {
      const updatedUser = await uploadAvatar(file);
      persistUser(updatedUser);
      message.success("Cập nhật ảnh đại diện thành công!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { userMessage?: string; message?: string } } };
      message.error(err.response?.data?.userMessage || err.response?.data?.message || "Tải ảnh thất bại.");
      setAvatarPreview(null);
    }
  };

  const displayName = user?.displayName || user?.email || "Người dùng";
  const avatarFallback = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="w-full">
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h3 className="text-xl font-semibold text-brand-950">Thông tin cá nhân</h3>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin cá nhân cơ bản của bạn</p>
      </div>

      {/* #10 (2026-08-19): AC yêu cầu hiển thị trạng thái 2FA trên màn hồ sơ — trước đây không
          có ở đâu trong Web Admin, dù trang bật/tắt TOTP riêng đã tồn tại. */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          {user?.totpEnabled ? (
            <ShieldCheck className="h-5 w-5 text-green-600" aria-hidden="true" />
          ) : (
            <ShieldOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-medium text-slate-800">
              Xác thực 2 lớp (2FA): {user?.totpEnabled ? "Đã bật" : "Chưa bật"}
            </p>
            <p className="text-xs text-gray-500">Bảo vệ tài khoản bằng mã xác thực khi đăng nhập</p>
          </div>
        </div>
        <Link href="/customer/settings/totp" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          {user?.totpEnabled ? "Quản lý" : "Bật ngay"}
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <Avatar
            src={avatarPreview || user?.avatarUrl || undefined}
            size={72}
            className="bg-blue-600 font-semibold text-2xl"
          >
            {avatarFallback}
          </Avatar>
          <button
            type="button"
            aria-label="Đổi ảnh đại diện"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar || isDeletingAvatar}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {user?.avatarUrl && (
            <button
              type="button"
              aria-label="Xóa ảnh đại diện"
              onClick={() => void handleDeleteAvatar()}
              disabled={isUploadingAvatar || isDeletingAvatar}
              className="absolute -left-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-600 text-white shadow-md transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            onChange={(e) => void handleAvatarFileChange(e)}
            className="hidden"
          />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{displayName}</p>
          <p className="text-xs text-slate-500">
            {isUploadingAvatar ? "Đang tải ảnh lên..." : isDeletingAvatar ? "Đang xóa ảnh..." : "JPEG, PNG hoặc WEBP, tối đa 5MB"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full lg:max-w-3xl">
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
          <FormInput
            control={control}
            name="displayName"
            label="Tên hiển thị"
            placeholder="Nhập tên hiển thị"
            id="profile-display-name"
            error={errors.displayName}
          />

          <FormDatePicker
            control={control}
            name="dateOfBirth"
            label="Ngày sinh"
            id="profile-date-of-birth"
            error={errors.dateOfBirth}
            className="w-full"
            format="DD/MM/YYYY"
            maxDate={dayjs()}
          />

          <FormSelect
            control={control}
            name="gender"
            label="Giới tính"
            id="profile-gender"
            error={errors.gender}
            options={GENDER_OPTIONS}
            allowClear
            placeholder="Chọn giới tính"
          />

          <FormInput
            control={control}
            name="hometown"
            label="Quê quán"
            placeholder="Ví dụ: Nghệ An"
            id="profile-hometown"
            error={errors.hometown}
          />
        </div>

        <FormTextArea
          control={control}
          name="address"
          label="Địa chỉ"
          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
          id="profile-address"
          error={errors.address}
          rows={2}
        />

        <div className="flex justify-end pt-4">
          <BaseButton
            type="primary"
            htmlType="submit"
            loading={isPending}
            className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-md shadow-blue-500/20 h-10 px-8 rounded-lg font-bold transition-all"
          >
            Lưu thay đổi
          </BaseButton>
        </div>
      </form>
    </div>
  );
}
