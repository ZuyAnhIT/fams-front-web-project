"use client";

import { useState } from "react";
import { useLogoutAll } from "@/features/customer/auth/hooks/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { message, Modal } from "antd";
import { ROUTES } from "@/constants/routes";
import BaseButton from "@/components/ui/BaseButton";
import { MonitorSmartphone, AlertTriangle } from "lucide-react";

export default function SessionManagement() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const logoutAllMutation = useLogoutAll();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmLogoutAll = () => {
    if (typeof window !== "undefined") {
      (window as any).__isLoggingOut = true;
    }
    logoutAllMutation.mutate(undefined, {
      onSuccess: () => {
        message.success("Đã đăng xuất khỏi tất cả các thiết bị.");
        setIsConfirmOpen(false);
        logout();
        router.push(ROUTES.LOGIN);
      },
      onError: (error: any) => {
        console.error("Logout All Error:", error);
        if (error.response?.status === 401) {
          message.error("Phiên đăng nhập đã hết hạn. Đang chuyển hướng...");
          logout();
          router.push(ROUTES.LOGIN);
        } else {
          message.error(`Có lỗi xảy ra: ${error?.message || "Vui lòng thử lại sau."}`);
        }
      },
    });
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <MonitorSmartphone className="w-5 h-5 text-brand-600" />
          Thiết bị & Phiên đăng nhập
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý các thiết bị và trình duyệt đang duy trì quyền truy cập vào tài khoản của bạn.
        </p>
      </div>

      <div className="bg-red-50 rounded-xl p-5 border border-red-100 flex flex-col items-start gap-4">
        <div>
          <h4 className="font-semibold text-red-800 text-[15px]">Nghi ngờ lộ tài khoản?</h4>
          <p className="text-sm text-red-600 mt-1">
            Nếu bạn nhận thấy hoạt động bất thường hoặc nghi ngờ tài khoản đã bị lộ, hãy đăng xuất khỏi tất cả các phiên đăng nhập ngay lập tức. Bạn sẽ cần phải đăng nhập lại trên thiết bị hiện tại sau khi thực hiện thao tác này.
          </p>
        </div>
        
        <BaseButton
          danger
          size="large"
          loading={logoutAllMutation.isPending}
          onClick={() => setIsConfirmOpen(true)}
          className="mt-2"
        >
          Đăng xuất khỏi tất cả thiết bị
        </BaseButton>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <span>Xác nhận đăng xuất khỏi mọi thiết bị</span>
          </div>
        }
        open={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onOk={handleConfirmLogoutAll}
        okText="Đăng xuất tất cả"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: logoutAllMutation.isPending }}
      >
        <p className="mt-4 text-gray-600">
          Bạn sẽ bị đăng xuất khỏi tài khoản trên thiết bị này và TẤT CẢ các thiết bị khác hiện đang đăng nhập. Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
}
