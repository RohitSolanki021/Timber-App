import type {
  ApiEnvelope,
  Cart,
  Customer,
  CustomerDetail,
  Invoice,
  InvoiceDetail,
  LoginResponse,
  Order,
  OrderDetail,
  PaginatedResult,
  Product,
} from "../types/api";
import { http, restoreAccessToken, setAccessToken } from "./httpClient";

const PROFILE_KEY = "profile";

restoreAccessToken();

function storeProfile(profile: LoginResponse["user"]) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem("selected_customer_id");
  localStorage.removeItem("selected_customer_name");
  localStorage.removeItem("selected_customer_pricing_type");
}

export const portalApi = {
  async login(payload: { email: string; password: string; app_role?: string }) {
    const data = await http<LoginResponse>("/api/login.php", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setAccessToken(data.token);
    storeProfile(data.user);
    return data;
  },

  async logout() {
    const res = await http<ApiEnvelope>("/api/logout.php", { method: "POST" });
    setAccessToken(null);
    clearProfile();
    return res;
  },

  me() {
    return http<{ success: boolean; user: unknown }>("/api/me.php");
  },
  getMe() {
    return this.me();
  },

  getCustomers(params?: Record<string, string | number | undefined>) {
    return http<Customer[] | PaginatedResult<Customer>>("/api/customers.php", { method: "GET" }, params);
  },

  getCustomerById(id: number) {
    return http<CustomerDetail>("/api/customers.php", { method: "GET" }, { id });
  },

  addCustomerNote(customer_id: number, note: string) {
    return http<ApiEnvelope>(
      "/api/customers.php",
      {
        method: "POST",
        body: JSON.stringify({ customer_id, note }),
      },
      { action: "add_note" },
    );
  },

  getOrders(params?: Record<string, string | number | undefined>) {
    return http<PaginatedResult<Order>>("/api/orders.php", { method: "GET" }, params);
  },

  getOrder(id: string) {
    return http<OrderDetail>("/api/orders.php", { method: "GET" }, { id });
  },

  getInvoices(params?: Record<string, string | number | undefined>) {
    return http<Invoice[] | PaginatedResult<Invoice>>("/api/invoices.php", { method: "GET" }, params);
  },

  getInvoice(id: string) {
    return http<{ success: true; data: InvoiceDetail }>("/api/invoices.php", { method: "GET" }, { id });
  },

  getProducts(params?: Record<string, string | number | undefined>) {
    return http<PaginatedResult<Product>>("/api/products.php", { method: "GET" }, params);
  },

  getDashboard() {
    return http<{ 
      monthly_sales: number;
      new_orders_week: number;
      assigned_customers: number;
      pending_orders_count: number;
      total_outstanding: number;
      due_invoices_count: number;
    }>("/api/dashboard.php", { method: "GET" });
  },

  getCart(customer_id?: number) {
    return http<Cart>("/api/cart.php", { method: "GET" }, customer_id ? { customer_id } : undefined);
  },

  addToCart(product_id: string, quantity: number, customer_id?: number) {
    return http<ApiEnvelope>("/api/cart.php", {
      method: "POST",
      body: JSON.stringify({
        product_id,
        quantity,
        ...(customer_id ? { customer_id } : {}),
      }),
    });
  },

  removeFromCart(product_id: string, customer_id?: number) {
    return http<ApiEnvelope>("/api/cart.php", { method: "DELETE" }, {
      product_id,
      ...(customer_id ? { customer_id } : {}),
    });
  },

  clearCart(customer_id?: number) {
    return http<ApiEnvelope>("/api/cart.php", { method: "DELETE" }, customer_id ? { customer_id } : undefined);
  },

  createOrder(items: Array<{ product_id: string; quantity: number }>, customer_id?: number) {
    return http<{ success: boolean; message: string; order_id: string; amount: number; pricing_type?: number }>(
      "/api/orders.php",
      {
        method: "POST",
        body: JSON.stringify({
          items,
          ...(customer_id ? { customer_id } : {}),
        }),
      },
    );
  },

  checkout(customer_id?: number) {
    return http<{ success: boolean; message: string; order_id: string; amount: number; pricing_type?: number }>(
      "/api/checkout.php",
      {
        method: "POST",
        body: JSON.stringify(customer_id ? { customer_id } : {}),
      },
    );
  },

  updateProfile(payload: { name?: string; phone?: string; contactPerson?: string; email?: string; address?: string }) {
    return http<ApiEnvelope>(
      "/api/customers.php",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      { action: "update_profile" },
    );
  },

  changePassword(current_password: string, new_password: string) {
    return http<ApiEnvelope>(
      "/api/customers.php",
      {
        method: "POST",
        body: JSON.stringify({ current_password, new_password }),
      },
      { action: "change_password" },
    );
  },

  health() {
    return http<{ success: boolean; status: string; api_version: string; database: string }>("/api/health.php");
  },
};
