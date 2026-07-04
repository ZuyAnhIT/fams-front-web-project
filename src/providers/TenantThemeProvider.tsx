"use client";

import { useEffect } from "react";
import { ConfigProvider, App } from "antd";
import { useTenantSettings } from "@/features/admin/tenant/hooks/use-tenant";
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
          colorLinkHover: primaryColor,
          
          // Kích thước tiêu chuẩn (Typography Scale)
          fontSize: 16,            // Body text: 16px
          fontSizeHeading1: 38,    // H1 (Nằm trong khoảng 32-48)
          fontSizeHeading2: 28,    // H2 (Nằm trong khoảng 24-32)
          fontSizeHeading3: 22,    // H3 (Nằm trong khoảng 20-24)
          fontSizeSM: 13,          // Small text: 13px (Nằm trong khoảng 12-14)
        },
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}
