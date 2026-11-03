import { APIResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data: APIResponse<T> = await res.json().catch(() => ({
    success: false,
    error: `HTTP ${res.status}: Failed to parse server response`,
  }));

  if (!res.ok || !data.success) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    throw new ApiError(errorMsg, res.status);
  }

  return data.data as T;
}

// Authentication
export async function fetchCurrentUser(token: string) {
  return request<any>("/api/v1/auth/me", { method: "GET" }, token);
}

// Products
export async function fetchProducts(
  token: string,
  params?: { category?: string; search?: string; activeOnly?: boolean }
) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  if (params?.activeOnly) query.set("activeOnly", "true");

  const qs = query.toString() ? `?${query.toString()}` : "";
  return request<any[]>(`/api/v1/products${qs}`, { method: "GET" }, token);
}

export async function fetchProductById(id: string, token: string) {
  return request<any>(`/api/v1/products/${id}`, { method: "GET" }, token);
}

export async function createProduct(
  payload: { name: string; category: string; priceSatang: number },
  token: string
) {
  return request<any>(
    "/api/v1/products",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updateProduct(
  id: string,
  payload: { name: string; category: string; priceSatang: number },
  token: string
) {
  return request<any>(
    `/api/v1/products/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updateProductStatus(
  id: string,
  isActive: boolean,
  token: string
) {
  return request<any>(
    `/api/v1/products/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    },
    token
  );
}

// Orders & POS
export async function createOrder(
  payload: { items: { productId: string; quantity: number }[] },
  token: string
) {
  return request<any>(
    "/api/v1/orders",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function fetchOrders(
  token: string,
  params?: { startDate?: string; endDate?: string; limit?: number; offset?: number }
) {
  const query = new URLSearchParams();
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset !== undefined) query.set("offset", params.offset.toString());

  const qs = query.toString() ? `?${query.toString()}` : "";
  return request<any>(`/api/v1/orders${qs}`, { method: "GET" }, token);
}

export async function fetchOrderById(id: string, token: string) {
  return request<any>(`/api/v1/orders/${id}`, { method: "GET" }, token);
}

// Dashboard
export async function fetchDashboardSummary(token: string) {
  return request<any>("/api/v1/dashboard/summary", { method: "GET" }, token);
}

