"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Receipt,
  Coffee,
  Award,
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { fetchDashboardSummary } from "@/lib/api";
import { DashboardSummary } from "@/types";
import { formatCurrency, formatDateTime, formatDateOnly } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary(token);
      setSummary(data);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Transform 7-day data for chart
  const chartData = summary?.salesLast7Days?.map((d) => ({
    date: formatDateOnly(d.date),
    revenue: d.totalSatang / 100, // in THB
    bills: d.billCount,
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-coffee-950 font-prompt">
            แดชบอร์ดภาพรวมร้าน
          </h1>
          <p className="text-sm text-coffee-600 mt-1 font-prompt">
            รายงานสถิติยอดขายและข้อมูลสรุปประจำวัน (เขตเวลา Asia/Bangkok)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>รีเฟรชข้อมูล</span>
          </Button>
          <Link href="/pos">
            <Button size="sm" className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800">
              <Coffee className="w-3.5 h-3.5" />
              <span>เปิดแคชเชียร์ POS</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          <Button size="sm" variant="outline" onClick={loadData}>
            ลองใหม่
          </Button>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Today's Revenue */}
        <Card className="border-coffee-200/80 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-coffee-600 font-prompt">
              ยอดขายรวมวันนี้
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28 my-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-coffee-950 font-prompt">
                {formatCurrency(summary?.todaySalesSatang || 0)}
              </div>
            )}
            <p className="text-xs text-coffee-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> ยอดสะสมตั้งแต่ 00:00 น.
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Today's Bills */}
        <Card className="border-coffee-200/80 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-coffee-600 font-prompt">
              จำนวนบิลวันนี้
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 my-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-coffee-950 font-prompt">
                {summary?.todayBillCount || 0}{" "}
                <span className="text-sm font-normal text-coffee-600">บิล</span>
              </div>
            )}
            <p className="text-xs text-coffee-500 mt-1">ออเดอร์ที่บันทึกสำเร็จวันนี้</p>
          </CardContent>
        </Card>

        {/* Metric 3: Today's Items Sold */}
        <Card className="border-coffee-200/80 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-coffee-600 font-prompt">
              จำนวนแก้ว/ชิ้นที่ขาย
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-sky-100/80 text-sky-800 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 my-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-coffee-950 font-prompt">
                {summary?.todayItemsSold || 0}{" "}
                <span className="text-sm font-normal text-coffee-600">ชิ้น</span>
              </div>
            )}
            <p className="text-xs text-coffee-500 mt-1">สินค้าเครื่องดื่มและเบเกอรี่</p>
          </CardContent>
        </Card>

        {/* Metric 4: Best Seller */}
        <Card className="border-coffee-200/80 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-coffee-600 font-prompt">
              เมนูขายดีที่สุด
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32 my-1" />
            ) : summary?.bestSeller ? (
              <div>
                <div className="text-lg font-bold text-coffee-900 truncate font-prompt" title={summary.bestSeller.productName}>
                  {summary.bestSeller.productName}
                </div>
                <p className="text-xs text-coffee-600 mt-1">
                  ขายแล้ว {summary.bestSeller.totalQuantity} แก้ว ({formatCurrency(summary.bestSeller.totalSatang)})
                </p>
              </div>
            ) : (
              <div className="text-sm text-coffee-500 italic mt-2">ยังไม่มีประวัติการขาย</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Sales Chart Section */}
      <Card className="border-coffee-200/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-prompt flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-700" />
              แนวโน้มยอดขายย้อนหลัง 7 วัน
            </CardTitle>
            <CardDescription className="font-prompt">
              แสดงยอดขายรวมในหน่วยบาท (THB) แยกตามแต่ละวัน
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : chartData.length > 0 ? (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e9df" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: "#ebd9c7" }}
                    tick={{ fill: "#6c4225", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#ebd9c7" }}
                    tick={{ fill: "#6c4225", fontSize: 12 }}
                    tickFormatter={(val) => `฿${val.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, "ยอดขาย"]}
                    labelStyle={{ color: "#381f10", fontWeight: 600 }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #eddac7",
                      boxShadow: "0 4px 12px rgba(79, 46, 26, 0.08)",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#a87444"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-coffee-400 italic">
              ไม่มีข้อมูลยอดขายย้อนหลัง
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders Table */}
      <Card className="border-coffee-200/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-prompt">รายการขายล่าสุด</CardTitle>
            <CardDescription className="font-prompt">
              บิลการขาย 10 รายการล่าสุดที่ชำระเงินเรียบร้อยแล้ว
            </CardDescription>
          </div>
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="text-coffee-700 flex items-center gap-1">
              <span>ดูทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : summary?.recentOrders && summary.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-coffee-100 text-xs uppercase tracking-wider text-coffee-500 font-prompt">
                    <th className="pb-3 font-semibold">รหัสบิล</th>
                    <th className="pb-3 font-semibold">เวลาที่ขาย</th>
                    <th className="pb-3 font-semibold">รายการสินค้า</th>
                    <th className="pb-3 font-semibold text-center">จำนวน</th>
                    <th className="pb-3 font-semibold text-right">ยอดรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-100/70">
                  {summary.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-coffee-50/50 transition-colors">
                      <td className="py-3 font-mono text-xs text-coffee-700">
                        {ord.id.substring(0, 10)}...
                      </td>
                      <td className="py-3 text-xs text-coffee-600">
                        {formatDateTime(ord.createdAt)}
                      </td>
                      <td className="py-3 text-xs font-medium text-coffee-900 max-w-xs truncate">
                        {ord.items.map((it) => `${it.productName} (x${it.quantity})`).join(", ")}
                      </td>
                      <td className="py-3 text-xs text-center text-coffee-700">
                        {ord.totalQuantity} ชิ้น
                      </td>
                      <td className="py-3 text-sm font-bold text-right text-coffee-950">
                        {formatCurrency(ord.totalSatang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-coffee-400 italic">
              ยังไม่มีบิลการขายในระบบ
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
