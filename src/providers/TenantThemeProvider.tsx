"use client";

import { useEffect } from "react";
import { ConfigProvider, App } from "antd";
import { useTenantSettings } from "@/features/admin/tenant/hooks/use-tenant";
import { COLORS } from "@/constants/colors";
import { APP_EVENTS } from "@/constants/events";

import { useAuthStore } from "@/stores/auth.store";

function SessionExpiredNotifier() {
  const { message } = App.useApp();

  useEffect(() => {
    const notifySessionExpired = () => {
      message.error({
        content: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!",
        duration: 3,
        key: "session-expired",
      });
    };

    window.addEventListener(APP_EVENTS.SESSION_EXPIRED, notifySessionExpired);
    return () => window.removeEventListener(APP_EVENTS.SESSION_EXPIRED, notifySessionExpired);
  }, [message]);

  return null;
}

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const { data: settings } = useTenantSettings(tenantId || undefined);
  
  // Lấy màu từ settings, nếu không có thì dùng màu mặc định của hệ thống
  const primaryColor = settings?.brandPrimaryColor || COLORS.blue[600];
  const secondaryColor = settings?.brandSecondaryColor || COLORS.green[500];
  const accentColor = settings?.brandAccentColor || COLORS.yellow[500];

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--brand-primary", primaryColor);
      document.documentElement.style.setProperty("--brand-secondary", secondaryColor);
      document.documentElement.style.setProperty("--brand-accent", accentColor);
      document.documentElement.dataset.dateFormat = settings?.dateFormat || "DD/MM/YYYY";
      document.documentElement.dataset.timeFormat = settings?.timeFormat || "HH:mm";
    }
  }, [accentColor, primaryColor, secondaryColor, settings?.dateFormat, settings?.timeFormat]);

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
        <SessionExpiredNotifier />
        {children}
      </App>
    </ConfigProvider>
  );
}
