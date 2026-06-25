"use client";

import { useEffect } from "react";
import { ConfigProvider, App } from "antd";
import { useTenantSettings } from "@/features/tenant/hooks/use-tenant";
import { COLORS } from "@/constants/colors";

import { useAuthStore } from "@/stores/auth.store";

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const { data: settings } = useTenantSettings(tenantId || undefined);
  
  // Lấy màu từ settings, nếu không có thì dùng màu mặc định của hệ thống
  const primaryColor = settings?.brandPrimaryColor || COLORS.brand[500]; // "#4f46e5"

  useEffect(() => {
    // Inject CSS variable `--brand-primary` vào thẻ html
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--brand-primary", primaryColor);
    }
  }, [primaryColor]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: primaryColor,
          borderRadius: 6,
          colorLink: primaryColor,
          colorLinkHover: primaryColor, // Có thể chỉnh opacity hoặc tính toán sau nếu cần
        },
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}
