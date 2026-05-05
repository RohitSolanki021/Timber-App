// API service for Customer Portal - connects to PHP backend
const API_BASE = (() => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) {
    return configured.endsWith('/') ? configured.slice(0, -1) : configured;
  }
  // Default to PHP backend
  return 'https://app.naturalplylam.com/api/index.php';
})();

let token: string | null = null;

function setToken(newToken: string) {
  token = newToken;
  if (newToken) {
    localStorage.setItem('customer_token', newToken);
  }
}

function getToken() {
  if (!token) token = localStorage.getItem('customer_token');
  return token;
}

function clearToken() {
  token = null;
  localStorage.removeItem('customer_token');
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
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  return res.json();
}

export const apiService = {
  // Auth
  async login(data: { email: string; password: string }) {
    const res = await request(`${API_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify({ ...data, app_role: 'Customer' })
    });
    if (res.token) setToken(res.token);
    return res;
  },

  async register(data: { name: string; email: string; password: string; phone: string; contactPerson?: string }) {
    return request(`${API_BASE}/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async logout() {
    clearToken();
    return { success: true };
  },

  async getMe() {
    return request(`${API_BASE}/me`);
  },

  // Products
  async getProducts(params?: { group?: string }) {
    const query = params?.group ? `?group=${params.group}` : '';
    return request(`${API_BASE}/products-v2${query}`);
  },

  async getProduct(id: string) {
    return request(`${API_BASE}/products-v2/${id}`);
  },

  async getProductStock(productId: string, thickness?: string, size?: string) {
    const params = new URLSearchParams();
    if (thickness) params.append('thickness', thickness);
    if (size) params.append('size', size);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`${API_BASE}/products-v2/${productId}/stock${query}`);
  },

  // Orders
  async getOrders(params?: { page?: number; per_page?: number; status?: string; order_type?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.order_type) query.append('order_type', params.order_type);
    return request(`${API_BASE}/customer/orders?${query.toString()}`);
  },

  async getOrder(id: string) {
    return request(`${API_BASE}/customer/orders/${id}`);
  },

  async createOrder(data: {
    items: Array<{
      product_id: string;
      product_name: string;
      product_group: string;
      thickness: string;
      size: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    notes?: string;
    photo_reference?: string;
  }) {
    return request(`${API_BASE}/orders/direct`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Invoices
  async getInvoices(params?: { page?: number; per_page?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.status) query.append('status', params.status);
    return request(`${API_BASE}/customer/invoices?${query.toString()}`);
  },

  async getInvoice(id: string) {
    return request(`${API_BASE}/customer/invoices/${id}`);
  },

  // Price calculation
  async calculatePrice(productId: string, customerId: number, quantity: number) {
    const params = new URLSearchParams({
      product_id: productId,
      customer_id: customerId.toString(),
      quantity: quantity.toString()
    });
    return request(`${API_BASE}/price/calculate?${params.toString()}`);
  },

  // Stock check
  async checkStock(productId: string, thickness: string, size: string, quantity: number) {
    const params = new URLSearchParams({
      product_id: productId,
      thickness,
      size,
      quantity: quantity.toString()
    });
    return request(`${API_BASE}/stock/check?${params.toString()}`);
  },

  // Banners
  async getBanners() {
    return request(`${API_BASE}/banners`);
  },

  // MPIN
  async setMpin(mpin: string) {
    return request(`${API_BASE}/mpin/set`, {
      method: 'POST',
      body: JSON.stringify({ mpin })
    });
  },

  async loginWithMpin(phone: string, mpin: string) {
    const res = await request(`${API_BASE}/mpin/login`, {
      method: 'POST',
      body: JSON.stringify({ phone, mpin })
    });
    if (res.token) setToken(res.token);
    return res;
  },

  async checkMpin() {
    return request(`${API_BASE}/mpin/check`);
  }
};

export default apiService;
