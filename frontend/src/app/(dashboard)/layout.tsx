"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout, error } = useAuth();
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowSlowNotice(true);
      }, 4000);
    } else {
      setShowSlowNotice(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-stone-50 p-4">
        <div className="w-14 h-14 rounded-2xl bg-coffee-800 text-cream-100 flex items-center justify-center shadow-lg animate-pulse mb-4">
          <Coffee className="w-7 h-7" />
        </div>
        <p className="text-base font-semibold text-coffee-800 font-prompt">
          กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
        </p>
        <p className="text-xs text-coffee-500 mt-1 font-prompt text-center max-w-sm">
          กำลังเชื่อมต่อข้อมูลกับ Go Backend และ Firebase Authentication
        </p>

        {showSlowNotice && (
          <div className="mt-6 p-4 max-w-sm w-full bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 text-center animate-in fade-in space-y-3 shadow-sm">
            <div className="flex items-center justify-center gap-1.5 font-semibold text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>การเชื่อมต่อใช้เวลานานกว่าปกติ</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              กรุณาตรวจสอบว่า Terminal ได้รันคำสั่ง <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">go run ./cmd/server/main.go</code> ที่พอร์ต 8080 อยู่หรือไม่
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                className="text-xs h-8 border-amber-300 hover:bg-amber-100"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                ไปหน้า Login
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-xs h-8"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                ลองใหม่
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50">
      {/* Desktop & iPad Landscape Sidebar */}
      <Sidebar className="hidden lg:flex flex-shrink-0" />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
