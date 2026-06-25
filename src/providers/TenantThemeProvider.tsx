"use client";

import { useEffect } from "react";
import { ConfigProvider } from "antd";
import { useTenantSettings } from "@/features/tenant/hooks/use-tenant";
import { COLORS } from "@/constants/colors";

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useTenantSettings();
  
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
      {children}
    </ConfigProvider>
  );
}
