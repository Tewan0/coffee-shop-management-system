"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Store,
  LayoutDashboard,
  Coffee,
  UtensilsCrossed,
  Receipt,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "แดชบอร์ด", href: "/", icon: LayoutDashboard },
  { label: "จุดขายหน้าร้าน (POS)", href: "/pos", icon: Coffee },
  { label: "จัดการเมนูสินค้า", href: "/menu", icon: UtensilsCrossed },
  { label: "ประวัติการขาย", href: "/orders", icon: Receipt },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setIsLogoutModalOpen(false);
      setMobileMenuOpen(false);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-coffee-100 bg-white/90 px-4 md:px-6 backdrop-blur-md">
        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-coffee-800 hover:bg-coffee-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-coffee-800 flex items-center justify-center text-cream-50">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-coffee-950 font-prompt">
              BrewCraft
            </span>
          </div>
        </div>

        {/* Desktop breadcrumb / greetings */}
        <div className="hidden md:flex items-center gap-2 text-sm text-coffee-600">
          <span className="font-prompt text-coffee-800 font-semibold">
            ระบบจัดการร้านกาแฟ
          </span>
          <span>/</span>
          <span className="text-coffee-500 font-prompt">
            {pathname === "/" && "ภาพรวมธุรกิจ"}
            {pathname === "/pos" && "ระบบแคชเชียร์ (POS)"}
            {pathname === "/menu" && "จัดการรายการเมนู"}
            {pathname === "/orders" && "ประวัติบิลการขาย"}
          </span>
        </div>

        {/* Status indicator & Quick action */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-prompt">Owner Connected</span>
          </div>

          {pathname !== "/pos" && (
            <Link
              href="/pos"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium shadow-sm transition-all"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span className="font-prompt">ไปที่หน้า POS</span>
            </Link>
          )}
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-50 md:hidden bg-stone-900/60 backdrop-blur-sm">
            <div className="w-4/5 max-w-xs h-full bg-coffee-950 text-cream-50 p-4 shadow-2xl flex flex-col justify-between">
              <nav className="space-y-1.5 pt-2">
                <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-coffee-400 font-prompt">
                  เมนูหลัก
                </div>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-coffee-800 text-amber-200 font-semibold"
                          : "text-coffee-300 hover:bg-coffee-900"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-prompt">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-coffee-900">
                <div className="flex items-center gap-3 mb-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-coffee-800 flex items-center justify-center text-xs text-amber-200 font-semibold">
                    {user?.displayName?.charAt(0) || "O"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-cream-100 truncate font-prompt">
                      {user?.displayName || "Store Owner"}
                    </p>
                    <p className="text-[10px] text-coffee-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-900/50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="font-prompt">ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Dialog for Mobile */}
      <Dialog
        open={isLogoutModalOpen}
        onOpenChange={setIsLogoutModalOpen}
        title="ยืนยันการออกจากระบบ"
        description="คุณต้องการออกจากระบบการจัดการร้านกาแฟใช่หรือไม่?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-sm mb-1 text-amber-950">ออกจากระบบร้านค้า</p>
              <p>
                เมื่อออกจากระบบแล้ว คุณจะต้องเข้าสู่ระบบด้วยบัญชี Google ของเจ้าของร้านอีกครั้งเพื่อเข้าถึงระบบ POS และแดชบอร์ด
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-coffee-100">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              disabled={loggingOut}
            >
              ยกเลิก
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmLogout}
              isLoading={loggingOut}
              className="bg-rose-600 hover:bg-rose-700 text-white font-prompt font-semibold"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              ยืนยันออกจากระบบ
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
