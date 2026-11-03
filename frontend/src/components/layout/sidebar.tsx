"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coffee,
  UtensilsCrossed,
  Receipt,
  LogOut,
  Store,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "แดชบอร์ด",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "จุดขายหน้าร้าน (POS)",
    href: "/pos",
    icon: Coffee,
  },
  {
    label: "จัดการเมนูสินค้า",
    href: "/menu",
    icon: UtensilsCrossed,
  },
  {
    label: "ประวัติการขาย",
    href: "/orders",
    icon: Receipt,
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen w-64 bg-coffee-950 text-cream-50 border-r border-coffee-900 select-none shadow-xl",
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-coffee-900/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-coffee-700 flex items-center justify-center text-cream-50 shadow-md">
          <Store className="w-5 h-5 text-cream-100" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide text-cream-100 font-prompt">
            BrewCraft Coffee
          </h1>
          <p className="text-xs text-coffee-400">POS & Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-coffee-400/90 font-prompt">
          เมนูหลัก
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-coffee-800/90 text-amber-200 shadow-inner font-semibold border border-coffee-700/50"
                  : "text-coffee-300 hover:text-cream-50 hover:bg-coffee-900/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-amber-400"
                      : "text-coffee-400 group-hover:text-cream-100"
                  )}
                />
                <span className="font-prompt">{item.label}</span>
              </div>
              {isActive && (
                <ChevronRight className="w-4 h-4 text-amber-400/80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-coffee-900/80 bg-coffee-950/70">
        <div className="flex items-center gap-3 mb-3 px-2">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "Owner"}
              className="w-9 h-9 rounded-full ring-2 ring-amber-500/30 object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-coffee-800 ring-2 ring-coffee-700 flex items-center justify-center text-xs font-semibold text-amber-200">
              {user?.displayName ? user.displayName.charAt(0) : "O"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-cream-100 truncate font-prompt">
              {user?.displayName || "Store Owner"}
            </p>
            <p className="text-[11px] text-coffee-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-coffee-300 hover:text-rose-300 hover:bg-rose-950/40 border border-coffee-900 hover:border-rose-900/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="font-prompt">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
