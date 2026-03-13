export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  gst_number?: string;
  gstNumber?: string;
  phone?: string;
  business_name?: string;
  businessName?: string;
  contact_person?: string;
  contactPerson?: string;
  address?: string;
  approval_status?: string;
  is_approved?: boolean;
  status?: string;
  pricing_type?: number;
}

export interface ProductImage {
  id?: number;
  image_path: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit?: string;
  priceUnit?: string;
  stock_status: string;
  stock_quantity: number;
  description: string;
  pricing_type?: number;
  pricing_rates?: Record<string, number>;
  primary_image?: string;
  images?: ProductImage[];
}

export interface OrderImage {
  id?: number;
  image_path: string;
  uploaded_by_name?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  customer_id: number;
  customerName?: string;
  status: string;
  amount: number;
  order_date: string;
  paymentStatus?: string;
  sales_person_id?: number;
  salesPerson?: string;
  pricing_type?: number;
  grand_total?: number | string;
  items?: OrderItem[];
  images?: OrderImage[];
}

export interface OrderItem {
  order_id: string;
  product_id: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  price?: number;
  name?: string;
  unit?: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  customer_id: number;
  customerName?: string;
  issue_date: string;
  due_date: string;
  sub_total: number;
  cgst: number;
  sgst: number;
  grand_total: number;
  status: string;
  pricing_type?: number;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PaginatedList<T> {
  data: T[];
  pagination: Pagination | null;
}


export interface Customer {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  outstandingBalance?: number | string;
  pricing_type?: number;
  status?: string;
  approval_status?: string;
  sales_person_id?: number;
  sales_person_name?: string;
}
