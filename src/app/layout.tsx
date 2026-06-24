import { ConfigProvider } from "antd";
import { COLORS } from "@/constants/colors";
import { QueryProvider } from "@/lib/QueryProvider";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FAMS Web Portal",
  description: "Field Attendance Management System Web Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.className}>
      <body>
        <QueryProvider>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: COLORS.brand[500],
                borderRadius: 6,
                colorLink: COLORS.brand[500],
                colorLinkHover: COLORS.brand[400],
              },
            }}
          >
            {children}
          </ConfigProvider>
        </QueryProvider>
      </body>
    </html>
  );
}