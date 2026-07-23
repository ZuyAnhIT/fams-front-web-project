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
  const primaryColor = settings?.brandPrimaryColor || COLORS.blue[600];

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
          borderRadius: 10,
          colorLink: primaryColor,
          colorLinkHover: primaryColor,
          colorBgLayout: "#f8fafc",
          colorText: "#0f172a",
          colorTextSecondary: "#64748b",
          colorBorder: "#e2e8f0",
          controlHeight: 40,
          
          // Kích thước tiêu chuẩn (Typography Scale)
          fontSize: 14,
          fontSizeHeading1: 30,
          fontSizeHeading2: 24,
          fontSizeHeading3: 20,
          fontSizeSM: 13,
        },
        components: {
          Input: {
            colorBorder: '#94a3b8', // slate-400
            activeBorderColor: primaryColor,
            hoverBorderColor: primaryColor,
            fontSize: 14,
          },
          Select: {
            colorBorder: '#94a3b8', // slate-400
            activeBorderColor: primaryColor,
            hoverBorderColor: primaryColor,
            fontSize: 14,
            optionFontSize: 14,
          },
        },
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}
