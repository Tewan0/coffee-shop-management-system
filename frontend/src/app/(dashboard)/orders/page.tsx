"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  Calendar,
  Search,
  Eye,
  ArrowLeft,
  ArrowRight,
  Filter,
  RefreshCw,
  Clock,
  User,
  CheckCircle,
  Printer,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { fetchOrders, fetchOrderById } from "@/lib/api";
import { Order, PaginatedOrdersResponse } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalesHistoryPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const response: PaginatedOrdersResponse = await fetchOrders(token, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: pageSize,
        offset,
      });

      setOrders(response.orders || []);
      setTotalCount(response.total || 0);
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาดในการโหลดประวัติการขาย",
        description: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [token, page, startDate, endDate]);

  const viewOrderDetails = async (orderId: string) => {
    if (!token) return;
    setLoadingDetails(true);
    setDetailsModalOpen(true);
    try {
      const data = await fetchOrderById(orderId, token);
      setSelectedOrder(data);
    } catch (err: any) {
      toast({
        title: "ไม่สามารถโหลดรายละเอียดบิลได้",
        description: err.message,
        type: "error",
      });
      setDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-coffee-950 font-prompt">
            ประวัติการขาย (Sales History)
          </h1>
          <p className="text-sm text-coffee-600 mt-1 font-prompt">
            ตรวจสอบรายการบิลย้อนหลัง ค้นหาตามช่วงวันที่ และดูรายละเอียดใบเสร็จ
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          isLoading={loading}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเฟรช</span>
        </Button>
      </div>

      {/* Date Range Filter Bar */}
      <Card className="border-coffee-200/80 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1 font-prompt">
                  ตั้งแต่วันที่
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-xl border border-coffee-200 bg-white px-3 text-xs text-coffee-900 focus:outline-none focus:ring-2 focus:ring-coffee-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-700 mb-1 font-prompt">
                  ถึงวันที่
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-xl border border-coffee-200 bg-white px-3 text-xs text-coffee-900 focus:outline-none focus:ring-2 focus:ring-coffee-500"
                />
              </div>

              {(startDate || endDate) && (
                <div className="self-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 text-xs text-coffee-600 hover:text-coffee-900"
                  >
                    ล้างตัวกรอง
                  </Button>
                </div>
              )}
            </div>

            <div className="text-xs text-coffee-600 font-prompt">
              พบทั้งหมด <span className="font-bold text-coffee-950">{totalCount}</span> รายการ
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-coffee-200/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[640px]">
                <thead className="bg-cream-100/60 border-b border-coffee-200/60 text-xs uppercase tracking-wider text-coffee-700 font-prompt">
                  <tr>
                    <th className="py-3.5 px-6 font-semibold">รหัสบิล</th>
                    <th className="py-3.5 px-6 font-semibold">วัน-เวลาที่ขาย</th>
                    <th className="py-3.5 px-6 font-semibold">รายการในบิล</th>
                    <th className="py-3.5 px-6 font-semibold text-center">จำนวนชิ้น</th>
                    <th className="py-3.5 px-6 font-semibold text-right">ยอดรวมสุทธิ</th>
                    <th className="py-3.5 px-6 font-semibold text-center">การกระทำ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-100">
                  {orders.map((ord) => (
                    <tr
                      key={ord.id}
                      className="hover:bg-coffee-50/50 transition-colors cursor-pointer"
                      onClick={() => viewOrderDetails(ord.id)}
                    >
                      <td className="py-3.5 px-6 font-mono text-xs text-amber-900 font-medium">
                        #{ord.id.substring(0, 10)}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-coffee-600 font-prompt">
                        {formatDateTime(ord.createdAt)}
                      </td>
                      <td className="py-3.5 px-6 text-xs font-medium text-coffee-900 max-w-xs truncate">
                        {ord.items.map((it) => `${it.productName} (x${it.quantity})`).join(", ")}
                      </td>
                      <td className="py-3.5 px-6 text-center text-xs text-coffee-700 font-prompt">
                        {ord.totalQuantity} ชิ้น
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-coffee-950 font-prompt">
                        {formatCurrency(ord.totalSatang)}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-coffee-700 hover:text-coffee-950"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewOrderDetails(ord.id);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>ดูบิล</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <Receipt className="w-12 h-12 text-coffee-300 mx-auto mb-3" />
              <p className="text-coffee-800 font-semibold font-prompt">ไม่พบประวัติการขาย</p>
              <p className="text-xs text-coffee-500 mt-1">
                {startDate || endDate
                  ? "ไม่มีบิลการขายในช่วงวันที่ที่คุณเลือก"
                  : "ยังไม่มีรายการขายที่บันทึกในระบบ"}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-coffee-100 bg-cream-50/50">
              <div className="text-xs text-coffee-600 font-prompt">
                หน้า {page} จาก {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="h-8 text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="h-8 text-xs"
                >
                  ถัดไป
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Receipt Modal */}
      <Dialog
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        title="รายละเอียดบิลการขาย"
        description={selectedOrder ? `รหัสบิล #${selectedOrder.id}` : "กำลังโหลดข้อมูล..."}
      >
        {loadingDetails || !selectedOrder ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bill Meta */}
            <div className="p-3.5 rounded-xl bg-cream-50 border border-coffee-200/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-coffee-500">วัน-เวลาที่ขาย:</span>
                <span className="font-semibold text-coffee-900">
                  {formatDateTime(selectedOrder.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-coffee-500">ผู้บันทึก (Owner UID):</span>
                <span className="font-mono text-coffee-700">
                  {selectedOrder.createdBy}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-coffee-500">สถานะ:</span>
                <Badge variant="success" className="text-[10px]">
                  ชำระเงินสำเร็จ (Paid)
                </Badge>
              </div>
            </div>

            {/* Items Breakdown Table */}
            <div className="border border-coffee-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-coffee-100/60 border-b border-coffee-200 text-coffee-700">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">รายการ</th>
                    <th className="py-2.5 px-3 font-semibold text-center">จำนวน</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ราคาต่อหน่วย</th>
                    <th className="py-2.5 px-3 font-semibold text-right">รวม (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-100">
                  {selectedOrder.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-cream-50/50">
                      <td className="py-2.5 px-3 font-medium text-coffee-950 font-prompt">
                        {it.productName}
                      </td>
                      <td className="py-2.5 px-3 text-center text-coffee-700">
                        {it.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-coffee-700 font-prompt">
                        {formatCurrency(it.unitPriceSatang)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-coffee-950 font-prompt">
                        {formatCurrency(it.subtotalSatang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Section */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex justify-between items-center">
              <div>
                <p className="text-xs text-amber-800">จำนวนรวม: {selectedOrder.totalQuantity} ชิ้น</p>
                <p className="text-sm font-bold text-coffee-950 font-prompt">ยอดสุทธิทั้งสิ้น</p>
              </div>
              <div className="text-xl font-bold text-amber-900 font-prompt">
                {formatCurrency(selectedOrder.totalSatang)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs text-coffee-800 border-coffee-300 hover:bg-cream-100"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ใบเสร็จ</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailsModalOpen(false)}
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

