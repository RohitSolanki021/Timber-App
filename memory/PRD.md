# Natural Plylam B2B Ordering System - PRD

## Original Problem Statement
Transform the application into a direct B2B Plywood/Timber ordering system with:
1. Single-Screen Fast Ordering: Product Group, Product, Thickness, Size, Quantity
2. Pricing Logic: 6 pricing tiers (Standard, Dealer, Wholesale, Premium, VIP, Enterprise)
3. Stock Logic: Strict validation based on (Product + Thickness + Size)
4. Billing Logic: Unified orders - single order can have both Plywood & Timber items
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
- `products_v2`: {product_group, name, thicknesses[], sizes[], pricing_tiers: {1-6}, images[]}
- `orders_v2`: {items, status, photo_url, order_type (Plywood/Timber/Mixed), transport_details, grand_total}
- `invoices_v2`: {order_id, items, amount, order_type} - **ONLY for Timber orders**
- `stock`: {stock_key, product_id, thickness, size, quantity, reserved}
- `customers`: {pricing_tier (1-6), approval_status, business_name, sales_person_id}

## Implementation Status

### Completed Features (April 6, 2026)

#### Sales Portal - FULLY FIXED ✅
- [x] **Dashboard** - Shows Monthly Sales, Assigned Customers (7), Pending Orders, Outstanding (₹23,004.76), Due Invoices Alert
- [x] **Customers Page** - Shows only assigned customers with search/filter (All/Approved/Pending)
- [x] **Orders Page** - Status filters: All, Pending, Approved, Dispatched, Cancelled
- [x] **Invoices Page** - View, Download, Share (WhatsApp) buttons on each invoice
- [x] **Invoice Detail Page** - Full invoice details with Download and WhatsApp share
- [x] **Fast Order** - Customer selection with search, Plywood/Timber product ordering
- [x] **CartProvider** - Wrapping App to enable cart functionality across pages

#### Order Status Naming - FIXED
- [x] Status filters: All, Pending, Approved, Dispatched, Cancelled
- [x] Plywood status progression: Pending → Approved → Estimated → Cancelled
- [x] Timber status progression: Pending → Approved → Dispatched → Cancelled
- [x] Updated in Admin Portal, Customer Portal, Sales Portal

#### Admin Products V2 - Edit Functionality
- [x] Click product card to open edit modal
- [x] Modal shows "Edit Product" title when editing
- [x] "Save Changes" button for updates
- [x] PUT /api/admin/products-v2/{product_id} endpoint

#### Sales Portal API Endpoints
- [x] `/api/sales/dashboard` - Returns monthly_sales, assigned_customers, pending_orders_count, total_outstanding, due_invoices_count
- [x] `/api/sales/customers` - Returns ONLY customers assigned to the logged-in sales person
- [x] `/api/sales/orders` - Returns orders placed by the sales person
- [x] `/api/sales/invoices` - Returns ONLY invoices for customers assigned to the sales person

### Test Credentials
- Super Admin: admin@naturalplylam.com / admin123
- Sales Person: sales@naturalplylam.com / sales123
- Customer (Tier 2): customer1@example.com / customer123 (MPIN: 1234)

## Backlog

### P1 - Next
- [ ] PDF generation with reportlab for invoice download (currently text file)
- [ ] Add product images upload in Admin

### P2 - Future
- [ ] Admin Banner Management UI
- [ ] CSV import for customers
- [ ] Product stock bulk update UI

## Test Reports
- Latest: `/app/test_reports/iteration_11.json` - All tests passing (Sales Portal)
- Previous: `/app/test_reports/iteration_10.json` - All tests passing (Admin Portal)

## Important Build Notes
When making changes to sales-portal or customer-portal:
1. Run `yarn build` in the respective directory
2. Copy builds to `/app/frontend/dist/sales/` and `/app/frontend/public/sales/` (for sales-portal)
3. Copy builds to `/app/frontend/dist/portal/` and `/app/frontend/public/portal/` (for customer-portal)

## Sales Portal Features Summary
| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ | sales@naturalplylam.com / sales123 |
| Dashboard | ✅ | Stats: Monthly Sales, Customers, Pending Orders, Outstanding |
| Customers | ✅ | Assigned customers only with search/filter |
| Fast Order | ✅ | Customer selection + Plywood/Timber ordering |
| Orders | ✅ | Status filters: All/Pending/Approved/Dispatched/Cancelled |
| Invoices | ✅ | View/Download/Share buttons |
| Invoice Detail | ✅ | Download + WhatsApp share |
| Profile | ✅ | User profile management |
