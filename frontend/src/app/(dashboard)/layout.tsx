"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coffee } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-stone-50">
        <div className="w-14 h-14 rounded-2xl bg-coffee-800 text-cream-100 flex items-center justify-center shadow-lg animate-pulse mb-4">
          <Coffee className="w-7 h-7" />
        </div>
        <p className="text-sm font-medium text-coffee-700 font-prompt">
          กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex flex-shrink-0" />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
