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
- **Database**: MongoDB (db: `plylam_admin`)

### Key Data Models
- `users`: {email, role, pricing_type (1-6), mpin, phone}
- `products_v2`: {product_group, name, thicknesses[], sizes[], pricing_tiers: {1-6}}
- `orders_v2`: {items, status, photo_url, order_type (Plywood/Timber/Mixed), transport_details, grand_total}
- `invoices_v2`: {order_id, items, amount, order_type} - **ONLY for Timber orders**
- `stock`: {stock_key, product_id, thickness, size, quantity, variant_prices}
- `customers`: {pricing_tier (1-6), approval_status, business_name}

### Key API Endpoints
- `POST /api/orders/direct` - Create unified order (can contain both Plywood & Timber - NO split)
- `GET /api/orders/v2` - List orders with filters (date_from, date_to, product_name)
- `PUT /api/orders/v2/{id}/items` - Admin edit item prices before approval
- `POST /api/orders/v2/{id}/confirm` - Approve order, create invoice (ONLY for Timber items)
- `POST /api/orders/v2/{id}/cancel` - Cancel order
- `PUT /api/orders/v2/{id}/status` - Update order status (Delivered)
- `GET /api/invoices/v2` - List invoices with type filters (start_date, end_date)
- `GET /api/products-v2` - Cascading product variants
- `POST /api/admin/products-v2` - Create product with dynamic variants

## Implementation Status

### Completed Features (April 5, 2026) - Order Flow Updates

#### Critical Business Logic Changes
- [x] **GST REMOVED** - No CGST/SGST calculations anywhere
- [x] **Plywood orders do NOT generate invoices** - Use "Estimated" pricing only
- [x] **Status renamed**: "Pending" → "Order Placed" (in UI only, DB stores "Pending")
- [x] **Unified Orders**: Single order can contain both Plywood AND Timber items (no split)
- [x] **Order Type**: Now shows "Plywood", "Timber", or "Mixed" based on items

#### FastOrder UX Fixes (Customer & Sales Portal)
- [x] **NO auto-advance** - Quantity field doesn't auto-add rows when typing
- [x] **Enter key to add row** - Press Enter in quantity field to add next product row
- [x] **"+ Add Product" button persists** - Always visible for adding more items
- [x] **Filter buttons don't reset** - PLYWOOD/TIMBER toggle only filters product dropdown, doesn't clear existing items
- [x] **Mixed orders supported** - Can add Plywood item, switch to Timber, add Timber item = single order
- [x] **Summary bar color changes**: Orange (Plywood only), Green (Timber only), Dark (Mixed)
- [x] **"Estimated" vs "Total" labels** - Shows "Estimated" only for Plywood-only orders

#### Customer Portal
- [x] Dashboard: Removed "Total Spend" section
- [x] Dashboard: Plywood/Timber blocks are clickable → navigate to filtered order history
- [x] Order History: "Order Placed" status display (yellow badge)
- [x] Order History: Date filters (From/To) and Item/Product filter
- [x] Invoices: Info banner "Invoices are generated for Timber orders only"
- [x] Order Detail: "Estimated Total" label for Plywood with info text
- [x] Order Detail: No "Download Invoice" button for Plywood orders

#### Admin Panel
- [x] Orders V2: "Order Placed" status filter (maps to "Pending" in DB)
- [x] Orders V2: Edit modal shows NO GST - only Sub Total and Estimated/Total
- [x] Products V2: Dynamic thickness/size text inputs (no hardcoded dropdowns)

#### Sales Portal
- [x] FastOrder: Customer selection screen with tier info
- [x] FastOrder: Same UX fixes as Customer Portal (no auto-advance, persistent Add button)

### Test Credentials
- Super Admin: admin@naturalplylam.com / admin123
- Sales Person: sales@naturalplylam.com / sales123
- Customer (Tier 2): customer1@example.com / customer123

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
- Latest: `/app/test_reports/iteration_9.json`
