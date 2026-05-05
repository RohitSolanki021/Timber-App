import { User, Product, CartItem, Order, Invoice } from "./types";

// Mock Data
let mockUser: User = {
  id: 1,
  email: 'demo@example.com',
  name: 'Demo Customer',
  role: 'Customer',
  gst_number: '27AAACR1234A1Z1',
  phone: '9876543210'
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

let mockCart: CartItem[] = [];
let mockOrders: Order[] = [
  {
    id: 'ORD-K9J2L4M1',
    user_id: 1,
    status: 'Dispatched',
    total: 10711.80,
    created_at: '2023-10-24T09:15:00Z',
    shipping_address: '882 Woodcutter Road, Portland, OR 97201',
    items: [
      { order_id: 'ORD-K9J2L4M1', product_id: 'PLY-001', quantity: 48, price: 85.00, name: 'Birch Veneer (3/4")', priceUnit: 'ea' },
      { order_id: 'ORD-K9J2L4M1', product_id: 'PLY-002', quantity: 36, price: 122.50, name: 'Marine Plywood (1/2")', priceUnit: 'ea' },
      { order_id: 'ORD-K9J2L4M1', product_id: 'TIM-001', quantity: 150, price: 14.81, name: 'Oak Finish Trim', priceUnit: 'ea' }
    ]
  },
  {
    id: 'ORD-A1B2C3D4',
    user_id: 1,
    status: 'Completed',
    total: 2500.00,
    created_at: '2023-10-20T14:30:00Z',
    shipping_address: '882 Woodcutter Road, Portland, OR 97201',
    items: [
      { order_id: 'ORD-A1B2C3D4', product_id: 'PLY-003', quantity: 10, price: 150.00, name: 'Teak Plywood', priceUnit: 'ea' },
      { order_id: 'ORD-A1B2C3D4', product_id: 'TIM-002', quantity: 181, price: 5.50, name: 'Pine Stud (2x4)', priceUnit: 'ea' }
    ]
  },
  {
    id: 'ORD-X7Y8Z9W0',
    user_id: 1,
    status: 'Approved',
    total: 1250.00,
    created_at: '2023-10-25T11:00:00Z',
    shipping_address: '882 Woodcutter Road, Portland, OR 97201',
    items: [
      { order_id: 'ORD-X7Y8Z9W0', product_id: 'PLY-004', quantity: 50, price: 18.50, name: 'MDF Board (1/4")', priceUnit: 'ea' },
      { order_id: 'ORD-X7Y8Z9W0', product_id: 'TIM-004', quantity: 5, price: 45.00, name: 'Walnut Hardwood', priceUnit: 'ea' }
    ]
  }
];
let mockInvoices: Invoice[] = [
  { id: 'INV-K9J2L4M1', order_id: 'ORD-K9J2L4M1', user_id: 1, amount: 10711.80, status: 'Paid', created_at: '2023-10-24T10:00:00Z' },
  { id: 'INV-A1B2C3D4', order_id: 'ORD-A1B2C3D4', user_id: 1, amount: 2500.00, status: 'Paid', created_at: '2023-10-20T15:00:00Z' }
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    async registerCustomer(data: { business_name: string; address: string; contact_person: string; phone: string; gstin: string; type: string }) {
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

  async getCart(): Promise<CartItem[]> {
    await sleep(100);
    return [...mockCart];
  },

  async addToCart(product_id: string, quantity: number) {
    await sleep(100);
    const product = mockProducts.find(p => p.id === product_id);
    if (!product) throw new Error("Product not found");

    const existing = mockCart.find(item => item.product_id === product_id);
    if (existing) {
      existing.quantity = quantity;
    } else {
      mockCart.push({
        product_id,
        quantity,
        name: product.name,
        price: product.price,
        priceUnit: product.priceUnit
      });
    }
    return { success: true };
  },

  async removeFromCart(product_id: string) {
    await sleep(100);
    mockCart = mockCart.filter(item => item.product_id !== product_id);
    return { success: true };
  },

  async checkout(shipping_address: string) {
    await sleep(800);
    const total = mockCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const newOrder: Order = {
      id: orderId,
      user_id: mockUser.id,
      status: 'Created',
      total,
      created_at: new Date().toISOString(),
      shipping_address,
      items: mockCart.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        priceUnit: item.priceUnit ?? item.unit
      }))
    };

    mockOrders.unshift(newOrder);
    
    const newInvoice: Invoice = {
      id: `INV-${orderId.split('-')[1]}`,
      order_id: orderId,
      user_id: mockUser.id,
      amount: total,
      status: 'Unpaid',
      created_at: new Date().toISOString()
    };
    mockInvoices.unshift(newInvoice);

    mockCart = [];
    return { order_id: orderId };
  },

  async getOrders(): Promise<Order[]> {
    await sleep(200);
    return [...mockOrders];
  },


  async createOrder(items: Array<{ product_id: string; quantity: number }>) {
    await sleep(500);
    const total = items.reduce((acc, item) => {
      const product = mockProducts.find((p) => p.id === item.product_id);
      return acc + (product ? product.price * item.quantity : 0);
    }, 0);

    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newOrder: Order = {
      id: orderId,
      user_id: mockUser.id,
      status: 'Created',
      total,
      created_at: new Date().toISOString(),
      shipping_address: 'Shipping address to be updated',
      items: items.map((item) => {
        const product = mockProducts.find((p) => p.id === item.product_id);
        return {
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: product?.price ?? 0,
          name: product?.name,
          priceUnit: product?.priceUnit ?? product?.unit,
        };
      }),
    };

    mockOrders.unshift(newOrder);

    const newInvoice: Invoice = {
      id: `INV-${orderId.split('-')[1]}`,
      order_id: orderId,
      user_id: mockUser.id,
      amount: total,
      status: 'Unpaid',
      created_at: new Date().toISOString(),
    };
    mockInvoices.unshift(newInvoice);

    return { success: true, order_id: orderId, amount: total };
  },

  async getCustomers() {
    await sleep(200);
    return [
      {
        id: 101,
        name: 'Oakridge Construction',
        contactPerson: 'Amit Mehta',
        phone: '9876543201',
        email: 'amit@oakridge.in',
        outstandingBalance: '12000.00',
      },
      {
        id: 102,
        name: 'Prime Interiors',
        contactPerson: 'Sneha Rao',
        phone: '9876543202',
        email: 'sneha@primeinteriors.in',
        outstandingBalance: '4500.00',
      },
    ];
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
