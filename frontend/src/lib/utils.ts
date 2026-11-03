import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format satang integer to Thai Baht currency string
 * e.g., 6500 -> ฿65.00
 */
export function formatCurrency(satang: number): string {
  const baht = satang / 100;
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht);
}

/**
 * Format raw number in Baht
 */
export function satangToBaht(satang: number): number {
  return satang / 100;
}

/**
 * Convert Baht to Satang integer (avoiding float errors)
 */
export function bahtToSatang(baht: number): number {
  return Math.round(baht * 100);
}

/**
 * Format date string to Thai readable format
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Format date only (YYYY-MM-DD or Thai)
 */
export function formatDateOnly(dateString: string): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}
