export type ProductCategory = "Coffee" | "Tea" | "Other Drinks" | "Bakery";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Coffee",
  "Tea",
  "Other Drinks",
  "Bakery",
];

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  priceSatang: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceSatang: number;
  subtotalSatang: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalSatang: number;
  totalQuantity: number;
  createdBy: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface BestSellerItem {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalSatang: number;
}

export interface DailySale {
  date: string; // "YYYY-MM-DD" in Asia/Bangkok
  totalSatang: number;
  billCount: number;
}

export interface DashboardSummary {
  todaySalesSatang: number;
  todayBillCount: number;
  todayItemsSold: number;
  bestSeller: BestSellerItem | null;
  salesLast7Days: DailySale[];
  recentOrders: Order[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
}
