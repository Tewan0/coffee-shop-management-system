"use client";

import React from "react";
import { Order } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface ThermalReceiptProps {
  order: Order;
  cashReceivedSatang?: number;
  changeSatang?: number;
  className?: string;
}

export function ThermalReceipt({
  order,
  cashReceivedSatang,
  changeSatang,
  className = "",
}: ThermalReceiptProps) {
  return (
    <div
      id="printable-receipt"
      className={`bg-white text-stone-900 font-mono text-xs p-4 sm:p-5 rounded-2xl border border-dashed border-coffee-300 shadow-sm mx-auto max-w-sm ${className}`}
    >
      {/* Receipt Header */}
      <div className="text-center pb-3 border-b border-dashed border-stone-400 space-y-0.5">
        <h2 className="text-base font-bold tracking-wider font-prompt text-coffee-950 uppercase">
          BrewCraft Coffee
        </h2>
        <p className="text-[10px] text-stone-600">
          Specialty Coffee & Bakery
        </p>
        <p className="text-[10px] text-stone-500">
          สาขาหลัก (Store Branch #01)
        </p>
      </div>

      {/* Bill Metadata */}
      <div className="py-2.5 text-[11px] space-y-1 border-b border-dashed border-stone-300">
        <div className="flex justify-between">
          <span className="text-stone-500">เลขที่บิล:</span>
          <span className="font-bold text-coffee-950">
            #{order.id.substring(0, 10).toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">วัน-เวลา:</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">แคชเชียร์:</span>
          <span>Owner (Authorized)</span>
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="py-2.5 border-b border-dashed border-stone-400 space-y-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-stone-500 pb-1">
          <span>รายการ</span>
          <span>รวม</span>
        </div>

        {order.items.map((it, idx) => (
          <div key={idx} className="text-[11px] space-y-0.5">
            <div className="flex justify-between font-medium text-stone-900">
              <span className="font-prompt truncate pr-2">{it.productName}</span>
              <span className="font-bold font-prompt flex-shrink-0">
                {formatCurrency(it.subtotalSatang)}
              </span>
            </div>
            <div className="text-[10px] text-stone-500 flex justify-between">
              <span>
                {it.quantity} x {formatCurrency(it.unitPriceSatang)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals & Calculations */}
      <div className="py-2.5 space-y-1.5 border-b-2 border-dashed border-stone-500">
        <div className="flex justify-between text-xs text-stone-600">
          <span>จำนวนสินค้ารวม:</span>
          <span className="font-bold text-stone-900">{order.totalQuantity} ชิ้น</span>
        </div>

        <div className="flex justify-between items-baseline text-sm font-bold text-coffee-950 pt-1">
          <span className="font-prompt">ยอดสุทธิ (Total):</span>
          <span className="text-base text-coffee-950 font-prompt">
            {formatCurrency(order.totalSatang)}
          </span>
        </div>

        {cashReceivedSatang !== undefined && cashReceivedSatang > 0 && (
          <>
            <div className="flex justify-between text-xs text-stone-600 pt-1 border-t border-dashed border-stone-200">
              <span>รับเงินสด (Cash):</span>
              <span>{formatCurrency(cashReceivedSatang)}</span>
            </div>
            {changeSatang !== undefined && (
              <div className="flex justify-between text-xs font-bold text-emerald-800">
                <span>เงินทอน (Change):</span>
                <span>{formatCurrency(changeSatang)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Receipt Footer */}
      <div className="text-center pt-3 text-[10px] text-stone-500 space-y-1">
        <p className="font-semibold text-stone-700">ชำระเงินเรียบร้อย (PAID)</p>
        <p className="text-coffee-900 font-prompt">*** ขอบคุณที่ใช้บริการ ***</p>
        <p className="text-[9px] text-stone-400">BrewCraft POS System</p>
      </div>
    </div>
  );
}

