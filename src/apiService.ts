// API service for Timber & Plywood mobile app
// Handles authentication, products, cart, orders, invoices, profile

import { Invoice, Order, PaginatedList } from "./types";

const DEFAULT_API_BASE_URL = 'http://localhost/natural/api';
const API_BASE = (() => {
  const configured = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).trim();
  if (!configured) return DEFAULT_API_BASE_URL;
  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
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

function authHeaders() {
  return getToken() ? { Authorization: `Bearer ${getToken()}` } : {};
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
  if (!res.ok) throw new Error(await res.text());
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

export const apiService = {
  async registerCustomer(data: { name: string; contactPerson: string; phone: string; email: string; password: string }) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('contactPerson', data.contactPerson);
    formData.append('phone', data.phone);
    formData.append('email', data.email);
    formData.append('password', data.password);

    return request(`${API_BASE}/register.php`, {
      method: 'POST',
      body: formData
    });
  },
  // Auth
  async login(data: { email: string; password: string; app_role?: string }) {
    const res = await request(`${API_BASE}/login.php`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setToken(res.token);
    return res;
  },
  async logout() {
    await request(`${API_BASE}/logout.php`, { method: 'POST' });
    setToken('');
    localStorage.removeItem('token');
  },
  async refreshToken() {
    const res = await request(`${API_BASE}/token/refresh.php`, { method: 'POST' });
    setToken(res.token);
    return res;
  },
  async getMe() {
    const res = await request(`${API_BASE}/me.php`);
    return res.user || res;
  },

  // Products
  async getProducts(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/products.php${query ? '?' + query : ''}`);
  },

  // Cart
  async getCart() {
    const res = await request(`${API_BASE}/cart.php`);
    return res.items || res;
  },
  async addToCart(product_id: string, quantity: number) {
    return request(`${API_BASE}/cart.php`, {
      method: 'POST',
      body: JSON.stringify({ product_id, quantity })
    });
  },
  async removeFromCart(product_id: string) {
    return request(`${API_BASE}/cart.php?product_id=${product_id}`, {
      method: 'DELETE'
    });
  },
  async clearCart() {
    return request(`${API_BASE}/cart.php`, { method: 'DELETE' });
  },

  // Orders
  async checkout(shipping_address: string) {
    return request(`${API_BASE}/checkout.php`, {
      method: 'POST',
      body: JSON.stringify({ shipping_address })
    });
  },
  async createOrder(items: Array<{ product_id: string; quantity: number }>) {
    return request(`${API_BASE}/orders.php`, {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },
  async uploadOrderImage(order_id: string, file: File) {
    const formData = new FormData();
    formData.append('order_id', order_id);
    formData.append('image', file);
    return request(`${API_BASE}/orders.php?action=upload_image`, {
      method: 'POST',
      body: formData
    });
  },
  async getOrders(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await request(`${API_BASE}/orders.php${query ? '?' + query : ''}`);
    return normalizeListResponse<Order>(res);
  },
  async getOrder(id: string) {
    return request(`${API_BASE}/orders.php?id=${id}`);
  },

  // Invoices
  async getInvoices(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await request(`${API_BASE}/invoices.php${query ? '?' + query : ''}`);
    return normalizeListResponse<Invoice>(res);
  },
  async getInvoice(id: string) {
    const res = await request(`${API_BASE}/invoices.php?id=${id}`);
    return res?.data || res;
  },

  // Profile
  async getCustomerProfile() {
    return request(`${API_BASE}/customers.php?action=me`);
  },
  async updateProfile(data: Record<string, any>) {
    return request(`${API_BASE}/customers.php?action=update_profile`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  async changePassword(current_password: string, new_password: string) {
    return request(`${API_BASE}/customers.php?action=change_password`, {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password })
    });
  },
  async createSubUser(data: Record<string, any>) {
    return request(`${API_BASE}/customers.php?action=create_sub_user`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Health
  async getHealth() {
    return request(`${API_BASE}/health.php`);
  }
};
