// API service for Natural Plylam Admin Panel
// Handles authentication, products, orders, invoices, customers

import { Customer, Invoice, Order, PaginatedList, User, Product } from "./types";

const API_BASE = (() => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) {
    return configured.endsWith('/') ? configured.slice(0, -1) : configured;
  }
  return `${window.location.origin}/api`;
})();

let token: string | null = null;

function setToken(newToken: string) {
  token = newToken;
  if (newToken) {
    localStorage.setItem('token', newToken);
  }
}

function getToken() {
  if (!token) token = localStorage.getItem('token');
  return token;
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...authHeaders(),
    ...(options.headers as Record<string, string> || {})
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Ignore parse errors
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

const extractListData = <T>(payload: any): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const normalizeListResponse = <T>(payload: any): PaginatedList<T> => ({
  data: extractListData<T>(payload),
  pagination: payload?.pagination || null
});

export interface CustomerFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  gst_number?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pricing_type?: number;
  credit_limit?: number;
  notes?: string;
  approval_status?: string;
  is_active?: boolean;
}

export interface CustomerDetail extends Customer {
  gst_number?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  credit_limit?: number;
  notes?: string;
  is_active?: boolean;
  outstanding_balance?: number;
  created_at?: string;
  updated_at?: string;
  orders?: Order[];
  invoices?: Invoice[];
  total_orders?: number;
  total_invoices?: number;
}

export const apiService = {
  // Auth
  async registerCustomer(data: { name: string; contactPerson: string; phone: string; email: string; password: string }) {
    return request(`${API_BASE}/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async login(data: { email: string; password: string; app_role?: string }) {
    const res = await request(`${API_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setToken(res.token);
    return res;
  },

  async logout() {
    try {
      await request(`${API_BASE}/logout`, { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
  },

  async refreshToken() {
    const res = await request(`${API_BASE}/token/refresh`, { method: 'POST' });
    setToken(res.token);
    return res;
  },

  async getMe(): Promise<User> {
    return request(`${API_BASE}/me`);
  },

  // Products
  async getProducts(params: Record<string, any> = {}): Promise<{ data: Product[]; products?: Product[] }> {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/products${query ? '?' + query : ''}`);
  },

  // Orders
  async createOrder(items: Array<{ product_id: string; quantity: number }>) {
    return request(`${API_BASE}/orders`, {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },

  async uploadOrderImage(order_id: string, file: File) {
    const formData = new FormData();
    formData.append('order_id', order_id);
    formData.append('image', file);
    return request(`${API_BASE}/orders?action=upload_image`, {
      method: 'POST',
      body: formData
    });
  },

  async getOrders(params: Record<string, any> = {}): Promise<PaginatedList<Order>> {
    const query = new URLSearchParams({ resource: "orders", ...params }).toString();
    const res = await request(`${API_BASE}/admin?${query}`);
    return normalizeListResponse<Order>(res);
  },

  async getOrder(id: string): Promise<Order> {
    return request(`${API_BASE}/orders?id=${id}`);
  },

  // Invoices
  async getInvoices(params: Record<string, any> = {}): Promise<PaginatedList<Invoice>> {
    const query = new URLSearchParams({ resource: "invoices", ...params }).toString();
    const res = await request(`${API_BASE}/admin?${query}`);
    return normalizeListResponse<Invoice>(res);
  },

  async getInvoice(id: string): Promise<Invoice> {
    const res = await request(`${API_BASE}/invoices?id=${id}`);
    return res?.data || res;
  },

  // Profile
  async getCustomerProfile() {
    return request(`${API_BASE}/customers?action=me`);
  },

  async updateProfile(data: Record<string, any>) {
    return request(`${API_BASE}/customers?action=update_profile`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async changePassword(current_password: string, new_password: string) {
    return request(`${API_BASE}/customers?action=change_password`, {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password })
    });
  },

  async createSubUser(data: Record<string, any>) {
    return request(`${API_BASE}/customers?action=create_sub_user`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // ============ CUSTOMERS CRUD ============
  async getCustomers(params: Record<string, any> = {}): Promise<PaginatedList<Customer>> {
    const query = new URLSearchParams({ resource: "customers", ...params }).toString();
    const res = await request(`${API_BASE}/admin?${query}`);
    return normalizeListResponse<Customer>(res);
  },

  async getCustomer(customerId: number): Promise<CustomerDetail> {
    const res = await request(`${API_BASE}/customers/${customerId}`);
    return res?.data || res;
  },

  async createCustomer(data: CustomerFormData): Promise<{ success: boolean; message: string; data: Customer }> {
    return request(`${API_BASE}/customers`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateCustomer(customerId: number, data: Partial<CustomerFormData>): Promise<{ success: boolean; message: string; data: Customer }> {
    return request(`${API_BASE}/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteCustomer(customerId: number, hardDelete: boolean = false): Promise<{ success: boolean; message: string }> {
    return request(`${API_BASE}/customers/${customerId}?hard_delete=${hardDelete}`, {
      method: 'DELETE'
    });
  },

  async approveCustomer(customer_id: number) {
    return request(`${API_BASE}/admin?action=approve_customer`, {
      method: 'POST',
      body: JSON.stringify({ customer_id })
    });
  },

  async rejectCustomer(customer_id: number, reason?: string) {
    return request(`${API_BASE}/admin?action=reject_customer`, {
      method: 'POST',
      body: JSON.stringify({ customer_id, reason })
    });
  },

  async toggleCustomerStatus(customer_id: number, is_active: boolean) {
    return request(`${API_BASE}/admin?action=toggle_customer_status`, {
      method: 'POST',
      body: JSON.stringify({ customer_id, is_active })
    });
  },

  // Admin - workflow actions
  async markInvoicePaid(invoice_id: string) {
    return request(`${API_BASE}/admin?action=mark_invoice_paid`, {
      method: 'POST',
      body: JSON.stringify({ invoice_id })
    });
  },

  async updateOrderStatus(order_id: string, status: string) {
    return request(`${API_BASE}/admin?action=update_order_status`, {
      method: 'POST',
      body: JSON.stringify({ order_id, status })
    });
  },

  async getAdminDashboard() {
    return request(`${API_BASE}/admin?resource=dashboard`);
  },

  // Health
  async getHealth() {
    return request(`${API_BASE}/health`);
  }
};
