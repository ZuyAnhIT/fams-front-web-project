import { TenantThemeProvider } from "@/providers/TenantThemeProvider";
import { QueryProvider } from "@/lib/QueryProvider";
import "./globals.css";

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
    <html lang="vi">
      <body>
        <QueryProvider>
          <TenantThemeProvider>
            {children}
          </TenantThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
