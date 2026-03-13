import { User, Product, Order, Invoice } from "./types";

// Mock Data
let mockUser: User = {
  id: 1,
  email: 'demo@example.com',
  name: 'Demo Customer',
  role: 'Customer',
  gst_number: '27AAACR1234A1Z1',
  phone: '9876543210',
  pricing_type: 2,
  approval_status: 'Approved'
};

let mockProducts: Product[] = [
  { id: 'PLY-001', name: 'Birch Veneer (3/4")', category: 'Plywood', price: 85.00, priceUnit: 'ea', stock_status: 'in_stock', stock_quantity: 100, description: 'High-quality birch veneer plywood.' },
  { id: 'PLY-002', name: 'Marine Plywood (1/2")', category: 'Plywood', price: 122.50, priceUnit: 'ea', stock_status: 'in_stock', stock_quantity: 50, description: 'Water-resistant marine grade plywood.' },
  { id: 'TIM-001', name: 'Oak Finish Trim', category: 'Timber', price: 14.81, priceUnit: 'ea', stock_status: 'in_stock', stock_quantity: 200, description: 'Solid oak finish trim for elegant interiors.' },
  { id: 'TIM-002', name: 'Pine Stud (2x4)', category: 'Timber', price: 5.50, priceUnit: 'ea', stock_status: 'in_stock', stock_quantity: 500, description: 'Standard pine stud for construction.' },
  { id: 'PLY-003', name: 'Teak Plywood', category: 'Plywood', price: 150.00, priceUnit: 'ea', stock_status: 'in_stock', stock_quantity: 30, description: 'Premium teak plywood for luxury furniture.' },
  { id: 'TIM-003', name: 'Cedar Decking', category: 'Timber', price: 24.99, priceUnit: 'ea', stock_status: 'in_stock', stock_quantity: 120, description: 'Natural cedar decking boards for outdoor use.' },
  { id: 'PLY-004', name: 'MDF Board (1/4")', category: 'Plywood', price: 18.50, priceUnit: 'ea', stock_status: 'in_stock', stock_quantity: 300, description: 'Medium-density fibreboard for versatile projects.' },
  { id: 'TIM-004', name: 'Walnut Hardwood', category: 'Timber', price: 45.00, priceUnit: 'ea', stock_status: 'in_stock', stock_quantity: 45, description: 'Rich walnut hardwood for high-end carpentry.' },
];

let mockOrders: Order[] = [
  {
    id: 'ORD-K9J2L4M1',
    customer_id: 1,
    customerName: 'Demo Customer',
    status: 'Dispatched',
    amount: 10711.80,
    order_date: '2023-10-24T09:15:00Z',
    paymentStatus: 'Credit',
    sales_person_id: 3,
    salesPerson: 'Sales Person User',
    items: [
      { order_id: 'ORD-K9J2L4M1', product_id: 'PLY-001', productName: 'Birch Veneer (3/4")', quantity: 48, unitPrice: 85.00, price: 85.00, name: 'Birch Veneer (3/4")', unit: 'ea' },
      { order_id: 'ORD-K9J2L4M1', product_id: 'PLY-002', productName: 'Marine Plywood (1/2")', quantity: 36, unitPrice: 122.50, price: 122.50, name: 'Marine Plywood (1/2")', unit: 'ea' },
      { order_id: 'ORD-K9J2L4M1', product_id: 'TIM-001', productName: 'Oak Finish Trim', quantity: 150, unitPrice: 14.81, price: 14.81, name: 'Oak Finish Trim', unit: 'ea' }
    ]
  },
  {
    id: 'ORD-A1B2C3D4',
    customer_id: 1,
    customerName: 'Demo Customer',
    status: 'Completed',
    amount: 2500.00,
    order_date: '2023-10-20T14:30:00Z',
    paymentStatus: 'Paid',
    sales_person_id: 3,
    salesPerson: 'Sales Person User',
    items: [
      { order_id: 'ORD-A1B2C3D4', product_id: 'PLY-003', productName: 'Teak Plywood', quantity: 10, unitPrice: 150.00, price: 150.00, name: 'Teak Plywood', unit: 'ea' },
      { order_id: 'ORD-A1B2C3D4', product_id: 'TIM-002', productName: 'Pine Stud (2x4)', quantity: 181, unitPrice: 5.50, price: 5.50, name: 'Pine Stud (2x4)', unit: 'ea' }
    ]
  },
  {
    id: 'ORD-X7Y8Z9W0',
    customer_id: 1,
    customerName: 'Demo Customer',
    status: 'Approved',
    amount: 1250.00,
    order_date: '2023-10-25T11:00:00Z',
    paymentStatus: 'Credit',
    sales_person_id: 3,
    salesPerson: 'Sales Person User',
    items: [
      { order_id: 'ORD-X7Y8Z9W0', product_id: 'PLY-004', productName: 'MDF Board (1/4")', quantity: 50, unitPrice: 18.50, price: 18.50, name: 'MDF Board (1/4")', unit: 'ea' },
      { order_id: 'ORD-X7Y8Z9W0', product_id: 'TIM-004', productName: 'Walnut Hardwood', quantity: 5, unitPrice: 45.00, price: 45.00, name: 'Walnut Hardwood', unit: 'ea' }
    ]
  }
];
let mockInvoices: Invoice[] = [
  {
    id: 'INV-K9J2L4M1',
    order_id: 'ORD-K9J2L4M1',
    customer_id: 1,
    customerName: 'Demo Customer',
    issue_date: '2023-10-24',
    due_date: '2023-11-08',
    sub_total: 9077.80,
    cgst: 817.00,
    sgst: 817.00,
    grand_total: 10711.80,
    status: 'Paid',
    pricing_type: 2
  },
  {
    id: 'INV-A1B2C3D4',
    order_id: 'ORD-A1B2C3D4',
    customer_id: 1,
    customerName: 'Demo Customer',
    issue_date: '2023-10-20',
    due_date: '2023-11-04',
    sub_total: 2118.64,
    cgst: 190.68,
    sgst: 190.68,
    grand_total: 2500.00,
    status: 'Paid',
    pricing_type: 2
  }
];
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    async registerCustomer(data: { name: string; contactPerson: string; phone: string; email: string; password: string }) {
      await sleep(500);
      // Simulate registration success
      return { success: true, ...data };
    },
  async login(credentials: { email?: string; password?: string; gst_number?: string; phone?: string }) {
    await sleep(500);
    localStorage.setItem("token", "mock-token");
    return { token: "mock-token", user: mockUser };
  },

  async getMe(): Promise<User> {
    await sleep(100);
    return { ...mockUser };
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    await sleep(500);
    mockUser = { ...mockUser, ...data };
    return { ...mockUser };
  },

  async getProducts(params?: { search?: string; category?: string; sort?: string }): Promise<{ data: Product[] }> {
    await sleep(300);
    let filtered = [...mockProducts];
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s));
    }
    if (params?.category) {
      filtered = filtered.filter(p => p.category === params.category);
    }
    return { data: filtered };
  },

  async checkout() {
    throw new Error("Cart functionality has been removed.");
  },

  async uploadOrderImage(order_id: string, file: File) {
    await sleep(200);
    const order = mockOrders.find(o => o.id === order_id);
    if (!order) throw new Error('Order not found');
    const imagePath = URL.createObjectURL(file);
    order.images = order.images || [];
    order.images.push({ image_path: imagePath, uploaded_by_name: mockUser.name, created_at: new Date().toISOString() });
    return { success: true, image_path: imagePath };
  },

  async getOrders(): Promise<Order[]> {
    await sleep(200);
    return [...mockOrders];
  },

  async getOrder(id: string): Promise<Order> {
    await sleep(200);
    const order = mockOrders.find(o => o.id === id);
    if (!order) throw new Error("Order not found");
    return { ...order };
  },

  async getInvoices(): Promise<Invoice[]> {
    await sleep(200);
    return [...mockInvoices];
  },

  async getInvoice(id: string): Promise<Invoice> {
    await sleep(200);
    const invoice = mockInvoices.find(i => i.id === id);
    if (!invoice) throw new Error("Invoice not found");
    return { ...invoice };
  },

  logout() {
    localStorage.removeItem("token");
  }
};
