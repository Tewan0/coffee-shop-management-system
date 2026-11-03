import { APIResponse } from "@/types";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If accessed from mobile/iPad via LAN IP (e.g., 192.168.1.x), connect to the same machine's Go port 8080
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:8080`;
    }
  }
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8080"
  );
}

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
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutMs = 8000; // 8 seconds safety timeout
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data: APIResponse<T> = await res.json().catch(() => ({
      success: false,
      error: `HTTP ${res.status}: Failed to parse server response`,
    }));

    if (!res.ok || !data.success) {
      const errorMsg =
        data.error || data.message || `Request failed with status ${res.status}`;
      throw new ApiError(errorMsg, res.status);
    }

    return data.data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError(
        "การเชื่อมต่อกับเซิร์ฟเวอร์ Go หมดเวลา (Timeout) กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่ที่พอร์ต 8080",
        504
      );
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      `ไม่สามารถเชื่อมต่อ Go Backend ที่ ${baseUrl} ได้: ${err.message}`,
      0
    );
  }
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
  params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
) {
  const query = new URLSearchParams();
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset !== undefined)
    query.set("offset", params.offset.toString());

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
