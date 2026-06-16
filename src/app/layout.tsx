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
      <body>{children}</body>
    </html>
  );
}