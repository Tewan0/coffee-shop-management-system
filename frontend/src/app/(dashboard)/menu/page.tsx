"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  CheckCircle2,
  XCircle,
  Coffee,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
} from "@/lib/api";
import { Product, ProductCategory, PRODUCT_CATEGORIES } from "@/types";
import { formatCurrency, satangToBaht, bahtToSatang, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuManagementPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Coffee" as ProductCategory,
    priceBaht: "",
  });
  const [formErrors, setFormErrors] = useState<{ name?: string; price?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Status toggle confirmation
  const [statusConfirmModal, setStatusConfirmModal] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const loadProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchProducts(token, {
        category: selectedCategory === "All" ? undefined : selectedCategory,
        search: search.trim() || undefined,
      });
      setProducts(data || []);
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาดในการโหลดรายการสินค้า",
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

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "Coffee",
      priceBaht: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      priceBaht: satangToBaht(product.priceSatang).toString(),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { name?: string; price?: string } = {};
    if (!formData.name.trim()) {
      errors.name = "กรุณากรอกชื่อเมนูสินค้า";
    }
    const priceNum = parseFloat(formData.priceBaht);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = "กรุณากรอกราคาที่ถูกต้อง (ตั้งแต่ 0 บาทขึ้นไป)";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !token) return;

    setSubmitting(true);
    const priceSatang = bahtToSatang(parseFloat(formData.priceBaht));

    try {
      if (editingProduct) {
        // Update product
        await updateProduct(
          editingProduct.id,
          {
            name: formData.name.trim(),
            category: formData.category,
            priceSatang,
          },
          token
        );
        toast({
          title: "แก้ไขสินค้าสำเร็จ",
          description: `อัปเดตเมนู ${formData.name} เรียบร้อยแล้ว`,
          type: "success",
        });
      } else {
        // Create product
        await createProduct(
          {
            name: formData.name.trim(),
            category: formData.category,
            priceSatang,
          },
          token
        );
        toast({
          title: "เพิ่มสินค้าใหม่สำเร็จ",
          description: `เพิ่มเมนู ${formData.name} ลงในระบบแล้ว`,
          type: "success",
        });
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message || "ไม่สามารถบันทึกข้อมูลสินค้าได้",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    const product = statusConfirmModal.product;
    if (!product || !token) return;

    setStatusSubmitting(true);
    try {
      const nextStatus = !product.isActive;
      await updateProductStatus(product.id, nextStatus, token);
      toast({
        title: nextStatus ? "เปิดการขายสินค้าแล้ว" : "ปิดการขายสินค้าชั่วคราวแล้ว",
        description: `${product.name} เปลี่ยนสถานะเป็น ${
          nextStatus ? "พร้อมขาย (Available)" : "ไม่พร้อมขาย (Unavailable)"
        }`,
        type: "success",
      });
      setStatusConfirmModal({ open: false, product: null });
      loadProducts();
    } catch (err: any) {
      toast({
        title: "ไม่สามารถเปลี่ยนสถานะได้",
        description: err.message,
        type: "error",
      });
    } finally {
      setStatusSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-coffee-950 font-prompt">
            จัดการเมนูสินค้า
          </h1>
          <p className="text-sm text-coffee-600 mt-1 font-prompt">
            เพิ่ม แก้ไข และกำหนดสถานะเปิด/ปิดการขายสินค้าในร้าน
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-coffee-800 hover:bg-coffee-900"
        >
          <Plus className="w-4 h-4" />
          <span className="font-prompt">เพิ่มเมนูใหม่</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-coffee-200/80 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("All")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  selectedCategory === "All"
                    ? "bg-coffee-800 text-cream-50 shadow-sm"
                    : "bg-cream-100 text-coffee-700 hover:bg-cream-200 border border-coffee-200/60"
                )}
              >
                ทั้งหมด
              </button>
              {PRODUCT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                    selectedCategory === cat
                      ? "bg-coffee-800 text-cream-50 shadow-sm"
                      : "bg-cream-100 text-coffee-700 hover:bg-cream-200 border border-coffee-200/60"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-coffee-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อเมนู..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-coffee-200 bg-white pl-9 pr-3 text-xs sm:text-sm text-coffee-950 placeholder:text-coffee-400 focus:outline-none focus:ring-2 focus:ring-coffee-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product List Table */}
      <Card className="border-coffee-200/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              {/* Desktop & Tablet Table (md:) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[620px]">
                  <thead className="bg-cream-100/60 border-b border-coffee-200/60 text-xs uppercase tracking-wider text-coffee-700 font-prompt">
                    <tr>
                      <th className="py-3.5 px-6 font-semibold">ชื่อเมนู</th>
                      <th className="py-3.5 px-6 font-semibold">หมวดหมู่</th>
                      <th className="py-3.5 px-6 font-semibold text-right">ราคา (บาท)</th>
                      <th className="py-3.5 px-6 font-semibold text-center">สถานะการขาย</th>
                      <th className="py-3.5 px-6 font-semibold text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-coffee-100">
                    {products.map((p) => (
                      <tr
                        key={p.id}
                        className={cn(
                          "hover:bg-coffee-50/50 transition-colors",
                          !p.isActive && "opacity-60 bg-stone-50/50"
                        )}
                      >
                        <td className="py-4 px-6 font-medium text-coffee-950 font-prompt">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-coffee-100 text-coffee-800 flex items-center justify-center flex-shrink-0">
                              <Coffee className="w-4 h-4" />
                            </div>
                            <span>{p.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant="outline" className="text-xs">
                            {p.category}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-coffee-950 font-prompt">
                          {formatCurrency(p.priceSatang)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge
                            variant={p.isActive ? "success" : "danger"}
                            className="cursor-pointer select-none"
                            onClick={() =>
                              setStatusConfirmModal({ open: true, product: p })
                            }
                          >
                            {p.isActive ? "พร้อมขาย (Available)" : "ปิดการขาย (Unavailable)"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(p)}
                              className="h-8 px-2.5 text-xs text-coffee-700"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              <span>แก้ไข</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setStatusConfirmModal({ open: true, product: p })
                              }
                              className="h-8 px-2.5 text-xs"
                            >
                              {p.isActive ? "ปิดขาย" : "เปิดขาย"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Product Cards View (< md:) */}
              <div className="md:hidden divide-y divide-coffee-100">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "p-4 transition-all duration-200 space-y-3 hover:shadow-sm",
                      p.isActive ? "bg-white hover:bg-cream-50/50" : "bg-stone-50/80 opacity-75"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-coffee-100 text-coffee-800 flex items-center justify-center flex-shrink-0">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-coffee-950 text-sm font-prompt truncate">
                            {p.name}
                          </h3>
                          <Badge variant="outline" className="text-[10px] mt-0.5">
                            {p.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-bold text-coffee-950 font-prompt">
                          {formatCurrency(p.priceSatang)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-coffee-100/60">
                      <button
                        onClick={() => setStatusConfirmModal({ open: true, product: p })}
                        className="text-left"
                      >
                        <Badge
                          variant={p.isActive ? "success" : "danger"}
                          className="text-[11px] py-1 cursor-pointer"
                        >
                          {p.isActive ? "● พร้อมขาย" : "○ ปิดขายชั่วคราว"}
                        </Badge>
                      </button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(p)}
                          className="h-9 px-3 text-xs text-coffee-800 border-coffee-300"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          <span>แก้ไข</span>
                        </Button>
                        <Button
                          variant={p.isActive ? "secondary" : "default"}
                          size="sm"
                          onClick={() => setStatusConfirmModal({ open: true, product: p })}
                          className="h-9 px-3 text-xs"
                        >
                          {p.isActive ? "ปิดขาย" : "เปิดขาย"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <Coffee className="w-12 h-12 text-coffee-300 mx-auto mb-3" />
              <p className="text-coffee-800 font-semibold font-prompt">ไม่พบรายการเมนู</p>
              <p className="text-xs text-coffee-500 mt-1">
                {search || selectedCategory !== "All"
                  ? "ลองเปลี่ยนคำค้นหาหรือหมวดหมู่สินค้า"
                  : "เริ่มต้นโดยการเพิ่มเมนูสินค้าแรกของคุณ"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Product Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingProduct ? "แก้ไขเมนูสินค้า" : "เพิ่มเมนูสินค้าใหม่"}
        description="กรอกรายละเอียดเมนูและราคาที่ต้องการขาย"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-coffee-800 mb-1 font-prompt">
              ชื่อสินค้า <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="เช่น Espresso, Matcha Latte, Croissant"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              error={formErrors.name}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-coffee-800 mb-1 font-prompt">
              หมวดหมู่ <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value as ProductCategory,
                }))
              }
              className="flex h-10 w-full rounded-xl border border-coffee-200 bg-white px-3 py-2 text-sm text-coffee-950 focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-coffee-800 mb-1 font-prompt">
              ราคาขาย (บาท) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="0.25"
              placeholder="เช่น 65 หรือ 70.00"
              value={formData.priceBaht}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, priceBaht: e.target.value }))
              }
              error={formErrors.price}
            />
            <p className="mt-1 text-[11px] text-coffee-400">
              ระบบจะจัดเก็บเป็นหน่วยสตางค์ (Satang) เพื่อป้องกันปัญหาทศนิยมคลาดเคลื่อน
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-coffee-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              className="bg-coffee-800 hover:bg-coffee-900"
            >
              {editingProduct ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialog for Status Change */}
      <Dialog
        open={statusConfirmModal.open}
        onOpenChange={(open) =>
          setStatusConfirmModal({ open, product: open ? statusConfirmModal.product : null })
        }
        title="ยืนยันการเปลี่ยนสถานะเมนู"
        description="คุณต้องการเปลี่ยนสถานะการจำหน่ายของสินค้านี้ใช่หรือไม่?"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cream-50 border border-coffee-200 text-sm">
            <p className="font-semibold text-coffee-950">
              {statusConfirmModal.product?.name}
            </p>
            <p className="text-xs text-coffee-600 mt-1">
              สถานะปัจจุบัน:{" "}
              {statusConfirmModal.product?.isActive
                ? "เปิดการขายอยู่ (Available)"
                : "ปิดการขายอยู่ (Unavailable)"}
            </p>
            <p className="text-xs text-coffee-700 mt-2">
              จะเปลี่ยนเป็น:{" "}
              <span className="font-bold text-coffee-900">
                {statusConfirmModal.product?.isActive
                  ? "ปิดการขายชั่วคราว (Unavailable)"
                  : "เปิดการขาย (Available)"}
              </span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setStatusConfirmModal({ open: false, product: null })
              }
              disabled={statusSubmitting}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleToggleStatus}
              isLoading={statusSubmitting}
              className={
                statusConfirmModal.product?.isActive
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              ยืนยันการเปลี่ยนสถานะ
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

