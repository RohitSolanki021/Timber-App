// API service for Sales Portal - connects to FastAPI backend
const API_BASE = (() => {
  const configured = (import.meta.env.VITE_API_BASE_URL || 'https://app.naturalplylam.com/api/index.php').trim();
  if (!configured) return 'https://app.naturalplylam.com/api/index.php';
  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
})();

let token: string | null = null;

function setToken(newToken: string) {
  token = newToken;
  if (newToken) {
    localStorage.setItem('sales_token', newToken);
  }
}

function getToken() {
  if (!token) token = localStorage.getItem('sales_token');
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
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  return res.json();
}

export const apiService = {
  // Auth
  async login(data: { email: string; password: string; app_role?: string }) {
    const res = await request(`${API_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify({ ...data, app_role: data.app_role || 'Sales Person' })
    });
    setToken(res.token);
    localStorage.setItem('sales_profile', JSON.stringify(res.user));
    return res;
  },

  async logout() {
    try {
      await request(`${API_BASE}/logout`, { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
    setToken('');
    localStorage.removeItem('sales_token');
    localStorage.removeItem('sales_profile');
  },

  async getMe() {
    return request(`${API_BASE}/me`);
  },

  // Dashboard
  async getDashboard() {
    return request(`${API_BASE}/sales/dashboard`);
  },

  // Products
  async getProducts(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/products${query ? '?' + query : ''}`);
  },

  async getProduct(id: string) {
    return request(`${API_BASE}/products/${id}`);
  },

  // Customers (Sales person's assigned customers)
  async getCustomers(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/sales/customers${query ? '?' + query : ''}`);
  },

  async getCustomer(id: number) {
    return request(`${API_BASE}/sales/customers/${id}`);
  },

  async createCustomer(data: Record<string, any>) {
    return request(`${API_BASE}/sales/customers`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Cart (for a specific customer)
  async getCart(customerId?: number) {
    const query = customerId ? `?customer_id=${customerId}` : '';
    return request(`${API_BASE}/sales/cart${query}`);
  },

  async addToCart(productId: string, quantity: number, customerId?: number) {
    return request(`${API_BASE}/sales/cart`, {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity, customer_id: customerId })
    });
  },

  async removeFromCart(productId: string, customerId?: number) {
    const query = customerId ? `&customer_id=${customerId}` : '';
    return request(`${API_BASE}/sales/cart?product_id=${productId}${query}`, {
      method: 'DELETE'
    });
  },

  async clearCart(customerId?: number) {
    const query = customerId ? `?customer_id=${customerId}` : '';
    return request(`${API_BASE}/sales/cart${query}`, { method: 'DELETE' });
  },

  // Orders
  async checkout(customerId?: number) {
    return request(`${API_BASE}/sales/checkout`, {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId })
    });
  },

  async getOrders(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/sales/orders${query ? '?' + query : ''}`);
  },

  async getOrder(id: string) {
    return request(`${API_BASE}/sales/orders/${id}`);
  },

  // Invoices
  async getInvoices(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/sales/invoices${query ? '?' + query : ''}`);
  },

  async getInvoice(id: string) {
    return request(`${API_BASE}/sales/invoices/${id}`);
  },

  // Profile
  async updateProfile(data: Record<string, any>) {
    return request(`${API_BASE}/sales/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async changePassword(current_password: string, new_password: string) {
    return request(`${API_BASE}/sales/change-password`, {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password })
    });
  },

  // Health
  async getHealth() {
    return request(`${API_BASE}/health`);
  }
};
