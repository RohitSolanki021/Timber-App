# Natural Plylam B2B Ordering System - PRD

## Original Problem Statement
Transform the application into a direct B2B Plywood/Timber ordering system with:
1. Single-Screen Fast Ordering: Product Group, Product, Thickness, Size, Quantity with cascading dropdowns
2. Pricing Logic: 6 pricing tiers (Standard, Dealer, Wholesale, Premium, VIP, Enterprise)
3. Stock Logic: Strict validation based on (Product + Thickness + Size)
4. Billing Logic: Split billing - single order splits into Plywood and Timber bills
5. Photo Order: Upload photo as reference order
6. Order State: Editable until Admin confirms
7. Sales Team: Select customer and place orders on their behalf
8. Admin Dashboard: Split tables for Plywood/Timber with filters

## Architecture

### Services
- **Backend**: FastAPI on port 8001 (`/app/backend/server.py`)
- **Frontend Admin**: React/Vite on port 3000 (`/app/frontend`)
- **Customer Portal**: React/Vite (`/app/customer-portal`) - served from `/portal` routes
- **Sales Portal**: React/Vite (`/app/sales-portal`) - served from `/sales` routes
- **Database**: MongoDB

### Key Data Models
- `users`: {email, role, pricing_type (1-6), mpin, phone}
- `products_v2`: {product_group, name, thicknesses[], sizes[], pricing_tiers: {1-6}}
- `orders_v2`: {items, status, photo_url, order_type (Plywood/Timber), transport_details, grand_total}
- `invoices_v2`: {order_id, items, amount, order_type} - **ONLY for Timber orders**
- `stock`: {stock_key, product_id, thickness, size, quantity, variant_prices}
- `customers`: {pricing_tier (1-6), approval_status, business_name}

### Key API Endpoints
- `POST /api/orders/direct` - Create split billing order (NO GST)
- `GET /api/orders/v2` - List orders with filters (date_from, date_to, product_name)
- `PUT /api/orders/v2/{id}/items` - Admin edit item prices before approval
- `POST /api/orders/v2/{id}/confirm` - Approve order, create invoice (ONLY for Timber)
- `POST /api/orders/v2/{id}/cancel` - Cancel order
- `PUT /api/orders/v2/{id}/status` - Update order status (Delivered)
- `GET /api/invoices/v2` - List invoices with type filters (start_date, end_date)
- `GET /api/products-v2` - Cascading product variants
- `POST /api/admin/products-v2` - Create product with dynamic variants
- `GET /api/admin/products-v2/template` - Download Excel template
- `POST /api/admin/products-v2/import` - Import products from Excel
- `GET /api/admin/products-v2/export` - Export products to Excel

## Implementation Status

### Completed Features (April 5, 2026) - 17-Point UI/UX Overhaul

#### Critical Business Logic Changes
- [x] **GST REMOVED** - No CGST/SGST calculations anywhere
- [x] **Plywood orders do NOT generate invoices** - Use "Estimated" pricing only
- [x] **Status renamed**: "Pending" → "Order Placed" (in UI only, DB still stores "Pending")
- [x] **Simplified statuses**: Order Placed → Approved → Delivered / Cancelled

#### Customer Portal
- [x] Dashboard: Removed "Total Spend" section
- [x] Dashboard: Plywood/Timber blocks are **clickable** - navigate to filtered order history
- [x] Order History: "Order Placed" status display (yellow badge)
- [x] Order History: **"Estimated" vs "Total"** labels - Plywood shows "Estimated", Timber shows "Total"
- [x] Order History: **Date filters** (From/To) and **Item/Product filter**
- [x] Invoices: Info banner "Invoices are generated for Timber orders only"
- [x] Invoices: Only shows Timber invoices (no Plywood filter option)
- [x] Order Detail: "Estimated Total" label for Plywood with info text
- [x] Order Detail: **No "Download Invoice" button** for Plywood orders
- [x] FastOrder: Two top-level buttons (PLYWOOD / TIMBER)
- [x] FastOrder: Manual quantity input (no dropdown)
- [x] FastOrder: Auto-expand product rows when filled
- [x] FastOrder: Transport fields **NOT mandatory** for self-pickup

#### Admin Panel
- [x] Orders V2: "Order Placed" status filter (maps to "Pending" in DB)
- [x] Orders V2: Edit modal shows **NO GST** - only Sub Total and Estimated/Total
- [x] Orders V2: "Estimated Total" label for Plywood orders
- [x] Products V2: **Dynamic thickness/size inputs** - no hardcoded dropdowns
- [x] Products V2: Text input fields with placeholders (e.g., "12 or 18.5", "8x4 or 2.44x1.22")

#### Sales Portal
- [x] FastOrder: Customer selection screen first
- [x] FastOrder: **PLYWOOD / TIMBER** toggle buttons at top
- [x] FastOrder: Manual quantity input
- [x] FastOrder: "Estimated:" label in summary for Plywood
- [x] FastOrder: Transport fields **NOT mandatory** for self-pickup

#### Backend
- [x] GST removed from all calculations
- [x] Invoice creation **skipped for Plywood orders**
- [x] Date filters added to orders/invoices endpoints (start_date, end_date)
- [x] Product name filter added to orders endpoint (product_name)

### Test Credentials
- Super Admin: admin@naturalplylam.com / admin123
- Sales Person: sales@naturalplylam.com / sales123
- Customer (Tier 2): customer1@example.com / customer123 (MPIN: 1234)

## Backlog

### P1 - In Progress
- [ ] **WhatsApp sharing** for invoices in Sales Portal
- [ ] **PDF generation** with reportlab for invoice download/share

### P2 - Future
- [ ] Admin Banner Management UI (backend done, needs Super Admin UI)
- [ ] Sales Portal: Filter invoices to show only their assigned customers' invoices
- [ ] CSV import for customers
- [ ] Product stock bulk update UI
- [ ] Analytics dashboard with date/item filters

## Test Reports
- Latest: `/app/test_reports/iteration_9.json` - 98% pass rate (all major features verified)
- Previous: `/app/test_reports/iteration_8.json` - 100% pass rate
