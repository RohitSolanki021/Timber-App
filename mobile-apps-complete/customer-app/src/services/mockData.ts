import type {
  Cart,
  Customer,
  CustomerDetail,
  Invoice,
  Order,
  OrderDetail,
  Product,
} from "../types/api";

export const mockProducts: Product[] = [
  {
    id: "PLY-001",
    name: "Marine Plywood",
    category: "Plywood",
    price: "1500.00",
    priceUnit: "sheet",
    stock: 120,
  },
  {
    id: "TIM-001",
    name: "Teak Timber",
    category: "Timber",
    price: "2200.00",
    priceUnit: "cft",
    stock: 80,
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 5,
    name: "Acme Pvt Ltd",
    contactPerson: "John Doe",
    phone: "+91-9000000000",
    email: "accounts@acme.com",
    outstandingBalance: "10000.00",
  },
];

export const mockCustomerDetail: CustomerDetail = {
  ...mockCustomers[0],
  notes: [
    {
      id: 10,
      customer_id: 5,
      user_id: 21,
      note: "Follow-up on payment due",
      created_at: "2025-01-05 09:00:00",
    },
  ],
};

export const mockOrders: Order[] = [
  {
    id: "ORD-20250101-0002",
    customer_id: 5,
    customerName: "Acme Pvt Ltd",
    status: "Pending",
    order_date: "2025-01-01 10:00:00",
    grand_total: "32500.00",
  },
];

export const mockOrderDetail: OrderDetail = {
  ...mockOrders[0],
  items: [
    {
      product_id: "PLY-001",
      productName: "Marine Plywood",
      quantity: 10,
      unitPrice: "1500.00",
    },
  ],
};

export const mockInvoices: Invoice[] = [
  {
    id: "INV-0001",
    order_id: "ORD-20250101-0002",
    issue_date: "2025-01-02",
    due_date: "2025-01-30",
    grand_total: "32500.00",
    status: "Unpaid",
    customer_name: "Acme Pvt Ltd",
  },
];

export const mockCart: Cart = {
  items: [
    {
      product_id: "PLY-001",
      name: "Marine Plywood",
      price: "1500.00",
      quantity: 10,
      line_total: "15000.00",
    },
  ],
  total: 15000,
};
