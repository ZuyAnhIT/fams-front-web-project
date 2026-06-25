import { TenantThemeProvider } from "@/providers/TenantThemeProvider";
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
          <TenantThemeProvider>
            {children}
          </TenantThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}