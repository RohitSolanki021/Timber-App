export type UserRole = "Customer" | "Sub-user" | "Sales Person";

export interface ApiEnvelope {
  success: boolean;
  message?: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
  customer_id?: number;
  phone?: string;
  gstin?: string;
}

export interface LoginResponse extends ApiEnvelope {
  token: string;
  expires_in: number;
  user: AuthUser;
}

export interface Customer {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  outstandingBalance?: string;
  pricing_type?: number;
  status?: string;
}

export interface CustomerNote {
  id: number;
  customer_id: number;
  user_id: number;
  note: string;
  created_at: string;
}

export interface CustomerDetail extends Customer {
  notes: CustomerNote[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number | string;
  priceUnit: string;
  unit?: string;
  stock?: number;
  stock_quantity?: number;
  stock_status?: string;
  pricing_type?: number;
  pricing_rates?: Record<string, number>;
  primary_image?: string;
  description?: string;
}

export interface Order {
  id: string;
  customer_id: number;
  customerName: string;
  status: string;
  order_date?: string;
  grand_total?: string;
  pricing_type?: number;
}

export interface OrderItem {
  product_id: string;
  productName?: string;
  quantity: number;
  unitPrice?: string;
}

export interface OrderDetails extends Order {
  items: OrderItem[];
  images?: Array<{ id: number; image_path: string; uploaded_by_name?: string; created_at: string }>;
}

export interface Invoice {
  id: string;
  order_id: string;
  issue_date: string;
  due_date: string;
  grand_total: string;
  status: string;
  customer_name?: string;
  pricing_type?: number;
}

export interface CartItem {
  product_id: string;
  name: string;
  price: string;
  quantity: number;
  line_total: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  pricing_type?: number;
  customer?: {
    id: number;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
    pricing_type?: number;
  };
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResult<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface CompanyInfo {
  name: string;
  address?: string;
}

export interface InvoiceLineItem {
  product_id: string;
  productName?: string;
  quantity: number;
  unitPrice?: string;
}

export interface InvoiceDetails extends Invoice {
  items: InvoiceLineItem[];
  company_info?: CompanyInfo;
  can_mark_paid?: boolean;
}

export interface DashboardMetrics {
  monthly_sales: number;
  new_orders_week: number;
  assigned_customers: number;
  pending_orders_count: number;
  total_outstanding: number;
  due_invoices_count: number;
}
