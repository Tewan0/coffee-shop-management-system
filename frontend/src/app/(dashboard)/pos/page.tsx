"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ShoppingBag,
  CreditCard,
  X,
  Printer,
  ArrowLeft,
  ArrowRight,
  Banknote,
  QrCode,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { fetchProducts, createOrder } from "@/lib/api";
import { Product, CartItem, ProductCategory, PRODUCT_CATEGORIES, Order } from "@/types";
import { formatCurrency, satangToBaht, bahtToSatang, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ThermalReceipt } from "@/components/receipt/thermal-receipt";

export default function PosPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Mobile / iPad View Tab: 'catalog' or 'cart'
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout confirmation modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Payment method & cash change calculator
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qr">("cash");
  const [cashReceivedBaht, setCashReceivedBaht] = useState<string>("");
  const [lastPaymentInfo, setLastPaymentInfo] = useState<{
    cashReceivedSatang?: number;
    changeSatang?: number;
  }>({});

  const loadProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // In POS, fetch only active products
      const data = await fetchProducts(token, {
        activeOnly: true,
        category: selectedCategory === "All" ? undefined : selectedCategory,
        search: search.trim() || undefined,
      });
      setProducts(data || []);
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาดในการโหลดรายการสินค้า POS",
        description: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [token, selectedCategory, search]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= 1000) {
          toast({
            title: "จำกัดจำนวน",
            description: "สั่งได้สูงสุดไม่เกิน 1,000 ชิ้นต่อรายการ",
            type: "error",
          });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (prev.length >= 50) {
        toast({
          title: "จำกัดรายการสินค้า",
          description: "สั่งซื้อได้สูงสุดไม่เกิน 50 รายการสินค้าต่อบิล",
          type: "error",
        });
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > 1000) {
              toast({
                title: "จำกัดจำนวน",
                description: "สั่งได้สูงสุดไม่เกิน 1,000 ชิ้นต่อรายการ",
                type: "error",
              });
              return item;
            }
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // UI Totals (for display only; backend will recalculate from live DB)
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalSatang = cart.reduce(
    (sum, item) => sum + item.product.priceSatang * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (cart.length === 0 || !token || submittingOrder) return;

    setSubmittingOrder(true);
    try {
      // Note: Backend recalculates prices server-side; we send only product IDs and quantities
      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const parsedCash = parseFloat(cashReceivedBaht) || 0;
      const cashSatang =
        paymentMethod === "cash" && parsedCash > 0
          ? bahtToSatang(parsedCash)
          : undefined;
      const changeSatang =
        cashSatang !== undefined ? Math.max(0, cashSatang - totalSatang) : undefined;

      setLastPaymentInfo({
        cashReceivedSatang: cashSatang,
        changeSatang,
      });

      const order = await createOrder(payload, token);
      setLastPlacedOrder(order);
      setIsConfirmOpen(false);
      setIsSuccessModalOpen(true);
      clearCart();
      setCashReceivedBaht("");
      setMobileTab("catalog"); // switch back to catalog on mobile

      toast({
        title: "บันทึกการขายสำเร็จ!",
        description: `รหัสบิล #${order.id.substring(0, 8)} ยอดรวม ${formatCurrency(
          order.totalSatang
        )}`,
        type: "success",
        duration: 4000,
      });
    } catch (err: any) {
      toast({
        title: "การบันทึกการขายล้มเหลว",
        description: err.message || "ไม่สามารถสร้างบิลการขายได้",
        type: "error",
      });
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile & iPad Portrait Tab Switcher */}
      <div className="flex lg:hidden rounded-2xl bg-cream-100 p-1 border border-coffee-200">
        <button
          onClick={() => setMobileTab("catalog")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
            mobileTab === "catalog"
              ? "bg-coffee-800 text-cream-50 shadow-sm"
              : "text-coffee-700 hover:text-coffee-950"
          )}
        >
          <Coffee className="w-4 h-4" />
          <span>เมนูสินค้า</span>
        </button>
        <button
          onClick={() => setMobileTab("cart")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 relative",
            mobileTab === "cart"
              ? "bg-coffee-800 text-cream-50 shadow-sm"
              : "text-coffee-700 hover:text-coffee-950"
          )}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>ตะกร้าสินค้า</span>
          {totalQuantity > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {totalQuantity}
            </span>
          )}
        </button>
      </div>

      <div className="h-[calc(100dvh-8.5rem)] min-h-[520px] lg:h-[calc(100dvh-6.5rem)] flex flex-col lg:flex-row gap-4 sm:gap-6 animate-in fade-in duration-300 relative">
        {/* Left side: Product catalog grid */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 bg-white rounded-3xl p-4 sm:p-5 border border-coffee-200/80 shadow-sm overflow-hidden",
            mobileTab === "cart" && "hidden lg:flex"
          )}
        >
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-coffee-100">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-coffee-950 font-prompt">
                แคชเชียร์ขายหน้าร้าน (POS)
              </h1>
              <p className="text-xs text-coffee-500 font-prompt">
                แตะหรือคลิกสินค้าเพื่อเพิ่มลงในรายการสั่งซื้อ
              </p>
            </div>

            {/* Search box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-coffee-400" />
              <input
                type="text"
                placeholder="ค้นหาเมนู..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-coffee-200 bg-stone-50 pl-9 pr-3 text-xs sm:text-sm text-coffee-950 placeholder:text-coffee-400 focus:outline-none focus:ring-2 focus:ring-coffee-500"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-none border-b border-coffee-100/70">
            <button
              onClick={() => setSelectedCategory("All")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                selectedCategory === "All"
                  ? "bg-coffee-800 text-cream-50 shadow-sm"
                  : "bg-cream-50 text-coffee-700 hover:bg-cream-100 border border-coffee-200/60"
              )}
            >
              ทั้งหมด
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  selectedCategory === cat
                    ? "bg-coffee-800 text-cream-50 shadow-sm"
                    : "bg-cream-50 text-coffee-700 hover:bg-cream-100 border border-coffee-200/60"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pt-3 pr-1 pb-16 lg:pb-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-28 sm:h-32 w-full rounded-2xl" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                {products.map((p) => {
                  const inCart = cart.find((it) => it.product.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className={cn(
                        "flex flex-col justify-between p-3 sm:p-4 rounded-2xl text-left border transition-all duration-200 group relative hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer",
                        inCart
                          ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40"
                          : "bg-cream-50/60 hover:bg-cream-100/70 border-coffee-200/70"
                      )}
                    >
                      {inCart && (
                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-coffee-800 text-[10px] font-bold text-cream-100 shadow-sm animate-in zoom-in-75 duration-150">
                          {inCart.quantity}
                        </span>
                      )}
                      <div>
                        <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-coffee-500 font-prompt">
                          {p.category}
                        </span>
                        <h3 className="font-semibold text-coffee-950 text-xs sm:text-sm mt-0.5 line-clamp-2 font-prompt group-hover:text-amber-800 transition-colors">
                          {p.name}
                        </h3>
                      </div>
                      <div className="mt-3 sm:mt-4 flex items-center justify-between">
                        <span className="font-bold text-coffee-900 text-xs sm:text-base font-prompt">
                          {formatCurrency(p.priceSatang)}
                        </span>
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-coffee-700 group-hover:bg-coffee-800 text-cream-50 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center text-coffee-400">
                <Coffee className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-prompt text-sm">ไม่พบสินค้าในหมวดหมู่นี้</p>
              </div>
            )}
          </div>

          {/* Floating Cart Pill on Mobile/Tablet when in Catalog mode */}
          {cart.length > 0 && mobileTab === "catalog" && (
            <div className="lg:hidden absolute bottom-3 left-4 right-4 z-20">
              <button
                onClick={() => setMobileTab("cart")}
                className="w-full bg-coffee-900 text-cream-50 p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-coffee-700 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-xs text-white">
                    {totalQuantity}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold font-prompt">
                    ยอดรวม: {formatCurrency(totalSatang)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-300 text-xs font-semibold font-prompt">
                  <span>เปิดตะกร้า</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Right side: Shopping Cart & Order Summary */}
        <div
          className={cn(
            "w-full lg:w-96 flex flex-col bg-white rounded-3xl p-4 sm:p-5 border border-coffee-200/80 shadow-sm",
            mobileTab === "catalog" && "hidden lg:flex"
          )}
        >
          <div className="flex items-center justify-between pb-3 border-b border-coffee-100">
            <div className="flex items-center gap-2">
              {/* Back to catalog button on mobile */}
              <button
                onClick={() => setMobileTab("catalog")}
                className="lg:hidden p-1.5 -ml-1 text-coffee-700 hover:bg-cream-100 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <ShoppingBag className="w-5 h-5 text-amber-700" />
              <h2 className="font-bold text-base sm:text-lg text-coffee-950 font-prompt">
                รายการสั่งซื้อ
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-prompt font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ล้างตะกร้า
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-cream-50 border border-coffee-100 hover:border-coffee-200 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs sm:text-sm font-semibold text-coffee-950 truncate font-prompt">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-coffee-500 font-prompt">
                      {formatCurrency(item.product.priceSatang)} x {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-coffee-200 rounded-xl p-0.5 shadow-xs">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-coffee-100 text-coffee-700 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-coffee-900 font-prompt">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-coffee-100 text-coffee-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      title="ลบรายการ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-coffee-400">
                <ShoppingBag className="w-10 h-10 mb-2 stroke-1 opacity-50" />
                <p className="text-sm font-prompt text-coffee-600 font-medium">
                  ยังไม่มีรายการในตะกร้า
                </p>
                <p className="text-xs text-coffee-400 mt-1 font-prompt">
                  คลิกเลือกสินค้าจากเมนูเพื่อเริ่มต้นคิดเงิน
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileTab("catalog")}
                  className="mt-4 lg:hidden text-xs"
                >
                  กลับไปเลือกเมนู
                </Button>
              </div>
            )}
          </div>

          {/* Bill Summary and Checkout Button */}
          <div className="pt-3 border-t border-coffee-100 space-y-2.5">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-coffee-600 text-xs">
                <span>จำนวนสินค้าทั้งหมด:</span>
                <span className="font-semibold text-coffee-800">{totalQuantity} ชิ้น</span>
              </div>
              <div className="flex justify-between text-coffee-950 font-bold text-base sm:text-lg pt-1 border-t border-dashed border-coffee-200">
                <span className="font-prompt">ยอดชำระสุทธิ:</span>
                <span className="text-amber-800 font-prompt font-bold">
                  {formatCurrency(totalSatang)}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              disabled={cart.length === 0 || submittingOrder}
              onClick={() => setIsConfirmOpen(true)}
              className="w-full h-11 sm:h-12 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span className="font-prompt">
                ชำระเงิน / ยืนยันบิล ({formatCurrency(totalSatang)})
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before creating order */}
      <Dialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="ยืนยันการบันทึกการขาย"
        description="กรุณาเลือกวิธีชำระเงินและตรวจสอบรายการสินค้าก่อนยืนยัน"
      >
        <div className="space-y-4">
          {/* Cart Item Summary */}
          <div className="rounded-2xl bg-cream-50 p-3.5 border border-coffee-200 max-h-48 overflow-y-auto space-y-2">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex justify-between text-xs text-coffee-900 border-b border-coffee-100/80 pb-1.5 last:border-0 last:pb-0"
              >
                <span className="font-medium font-prompt truncate pr-2">
                  {item.product.name} x {item.quantity}
                </span>
                <span className="font-semibold text-coffee-950 font-prompt flex-shrink-0">
                  {formatCurrency(item.product.priceSatang * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-coffee-800 font-prompt">
              วิธีการชำระเงิน:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "flex-1 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all font-prompt",
                  paymentMethod === "cash"
                    ? "bg-coffee-800 text-cream-50 border-coffee-800 shadow-sm"
                    : "bg-cream-50 text-coffee-700 border-coffee-200 hover:bg-cream-100"
                )}
              >
                <Banknote className="w-4 h-4" />
                <span>เงินสด (Cash)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("qr")}
                className={cn(
                  "flex-1 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all font-prompt",
                  paymentMethod === "qr"
                    ? "bg-coffee-800 text-cream-50 border-coffee-800 shadow-sm"
                    : "bg-cream-50 text-coffee-700 border-coffee-200 hover:bg-cream-100"
                )}
              >
                <QrCode className="w-4 h-4" />
                <span>สแกน QR Code</span>
              </button>
            </div>

            {/* Cash Calculator */}
            {paymentMethod === "cash" && (
              <div className="p-3.5 rounded-xl bg-stone-50 border border-coffee-200 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-coffee-800 font-prompt">
                    รับเงินสดมา (บาท):
                  </label>
                  <input
                    type="number"
                    placeholder={satangToBaht(totalSatang).toString()}
                    value={cashReceivedBaht}
                    onChange={(e) => setCashReceivedBaht(e.target.value)}
                    className="w-32 text-right px-2.5 py-1 text-sm font-bold border border-coffee-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500 bg-white text-coffee-950"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setCashReceivedBaht(satangToBaht(totalSatang).toString())}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 transition-colors font-prompt"
                  >
                    พอดี (฿{satangToBaht(totalSatang)})
                  </button>
                  {[100, 500, 1000].map((amt) => {
                    if (amt < satangToBaht(totalSatang)) return null;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashReceivedBaht(amt.toString())}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white hover:bg-cream-100 text-coffee-800 border border-coffee-200 transition-colors"
                      >
                        ฿{amt}
                      </button>
                    );
                  })}
                </div>

                {/* Change calculation display */}
                {parseFloat(cashReceivedBaht) > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-coffee-200/80 text-xs font-bold font-prompt">
                    <span className="text-coffee-700">เงินทอน (Change):</span>
                    <span
                      className={cn(
                        "text-sm font-prompt",
                        parseFloat(cashReceivedBaht) >= satangToBaht(totalSatang)
                          ? "text-emerald-700"
                          : "text-rose-600"
                      )}
                    >
                      {parseFloat(cashReceivedBaht) >= satangToBaht(totalSatang)
                        ? formatCurrency(bahtToSatang(parseFloat(cashReceivedBaht)) - totalSatang)
                        : "เงินที่รับมายังไม่ครบ"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "qr" && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 animate-in fade-in duration-150">
                <QrCode className="w-5 h-5 text-amber-700 flex-shrink-0" />
                <p>ให้ลูกค้ายิงสแกน QR / PromptPay หลังได้รับยอดโอนแล้วกดยืนยัน</p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-coffee-950 flex justify-between items-center text-sm font-bold">
            <span className="font-prompt">ยอดชำระรวมทั้งสิ้น:</span>
            <span className="text-lg text-amber-900 font-prompt">
              {formatCurrency(totalSatang)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={submittingOrder}
            >
              แก้ไขตะกร้า
            </Button>
            <Button
              onClick={handleCheckout}
              isLoading={submittingOrder}
              disabled={
                submittingOrder ||
                (paymentMethod === "cash" &&
                  parseFloat(cashReceivedBaht) > 0 &&
                  parseFloat(cashReceivedBaht) < satangToBaht(totalSatang))
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-prompt font-semibold active:scale-95 transition-all"
            >
              ยืนยันการรับชำระเงิน
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Order Success & Thermal Print Modal */}
      <Dialog
        open={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
        title="บันทึกการขายสำเร็จเรียบร้อย"
        description={lastPlacedOrder ? `บิลเลขที่ #${lastPlacedOrder.id.substring(0, 10)}` : ""}
      >
        {lastPlacedOrder && (
          <div className="space-y-4">
            <div className="text-center py-2 animate-in zoom-in-75 duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-100 ring-8 ring-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-lg font-bold text-coffee-950 font-prompt">
                รับชำระเงินสำเร็จเรียบร้อย!
              </p>
              <p className="text-xs text-coffee-500 font-prompt">
                ยอดสุทธิ {formatCurrency(lastPlacedOrder.totalSatang)} (จำนวน {lastPlacedOrder.totalQuantity} ชิ้น)
              </p>
            </div>

            {/* Thermal Receipt Preview */}
            <div className="max-h-72 overflow-y-auto rounded-xl p-1 bg-stone-100/60 border border-coffee-200">
              <ThermalReceipt
                order={lastPlacedOrder}
                cashReceivedSatang={lastPaymentInfo.cashReceivedSatang}
                changeSatang={lastPaymentInfo.changeSatang}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-coffee-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs text-coffee-800 border-coffee-300 hover:bg-cream-100"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ใบเสร็จ (Thermal Print)</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setIsSuccessModalOpen(false)}
                className="bg-coffee-800 hover:bg-coffee-900 text-white font-prompt"
              >
                ทำรายการต่อไป
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
