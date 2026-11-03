import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/hooks/use-toast";

export const metadata: Metadata = {
  title: "BrewCraft - ระบบจัดการร้านกาแฟ (Coffee Shop Management System)",
  description: "ระบบบริหารจัดการร้านกาแฟขนาดเล็ก: แคชเชียร์ POS, คลังเมนูสินค้า, สรุปยอดขาย และรายงานวิเคราะห์",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased min-h-screen bg-stone-50 selection:bg-amber-200 selection:text-coffee-950">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
