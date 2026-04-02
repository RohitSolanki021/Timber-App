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
- **Customer Portal**: React/Vite (`/app/customer-portal`)
- **Sales Portal**: React/Vite (`/app/sales-portal`)
- **Database**: MongoDB

### Key Data Models
- `users`: {email, role, pricing_type (1-6), mpin, phone}
- `products_v2`: {product_group, name, thickness, size, stock, pricing_tiers: {1-6}}
- `orders_v2`: {items, status, photo_url, order_type (Plywood/Timber), transport_details}
- `invoices_v2`: {order_id, items, amount, order_type}
- `stock`: {stock_key, product_id, thickness, size, quantity, variant_prices}
- `customers`: {pricing_tier (1-6), approval_status, business_name}

### Key API Endpoints
- `POST /api/orders/direct` - Create split billing order
- `GET /api/orders/v2` - List orders with filters
- `PUT /api/orders/v2/{id}/items` - Admin edit item prices before approval
- `POST /api/orders/v2/{id}/confirm` - Approve order, create invoice
- `POST /api/orders/v2/{id}/cancel` - Cancel order
- `PUT /api/orders/v2/{id}/status` - Update order status (Delivered)
- `GET /api/invoices/v2` - List invoices with type filters
- `GET /api/products-v2` - Cascading product variants
- `POST /api/admin/products-v2` - Create product with variants
- `GET /api/admin/products-v2/template` - Download Excel template
- `POST /api/admin/products-v2/import` - Import products from Excel
- `GET /api/admin/products-v2/export` - Export products to Excel
- `GET /api/sales/customers` - Customers for sales portal
- `POST /api/sales/customers` - Create customer (auto-approved)

## Implementation Status

### Completed Features (April 2, 2026)

#### Customer Portal
- [x] FastOrder single-screen with cascading dropdowns (Product → Thickness → Size)
- [x] Searchable product dropdowns
- [x] MPIN Login
- [x] Dynamic banners on homepage
- [x] Product catalog with search
- [x] Photo order upload
- [x] Transport details modal with **MANDATORY fields**
- [x] **Quantity dropdown** with preset values (1,2,3,5,10,20,50,100) + custom option
- [x] **Simplified order statuses**: Order Placed → Approved → Delivered / Cancelled

#### Admin Panel
- [x] Orders V2 page with Plywood/Timber type filters
- [x] **Edit button** to modify item prices/quantities before approval
- [x] Approve/Cancel buttons for pending orders
- [x] **Simplified status filters**: Order Placed, Approved, Delivered, Cancelled
- [x] Order detail modal view with full breakdown
- [x] 6-tier pricing in Customer create/edit forms
- [x] Invoices V2 page with Plywood/Timber type filters
- [x] Invoice detail page with embedded items
- [x] **Products V2** with variant management (thickness × size × tier pricing)
- [x] **Excel template download** for product import
- [x] **Excel upload** for bulk product import
- [x] **Excel export** of all products

#### Sales Portal
- [x] FastOrder flow with customer selection first
- [x] Add Customer with 6-tier pricing (auto-approved)
- [x] Updated navigation (New Order highlighted)
- [x] **Quantity dropdown** with preset values
- [x] **Mandatory transport fields**

#### Backend
- [x] Split billing logic (Plywood/Timber separation)
- [x] 6-tier pricing support
- [x] Order confirmation creates invoice
- [x] Stock validation per variant
- [x] **Order items price editing** endpoint
- [x] **Excel import/export** with openpyxl + pandas
- [x] **Simplified statuses**: Pending, Approved, Delivered, Cancelled

### Test Credentials
- Super Admin: admin@naturalplylam.com / admin123
- Worker Admin: worker@naturalplylam.com / worker123
- Sales Person: sales@naturalplylam.com / sales123
- Customer (Tier 2): customer1@example.com / customer123 (MPIN: 1234, Phone: 9876543212)

## Backlog (P1/P2)

### P1 - Important
- [ ] Admin Banner Management UI (backend done, needs Super Admin UI)
- [ ] Update delivered orders status from admin

### P2 - Future
- [ ] PDF generation with reportlab for invoices
- [ ] CSV import for customers
- [ ] Order edit functionality (before approval) from customer portal
- [ ] Product stock bulk update UI
- [ ] Analytics dashboard with filters

## Test Reports
- Latest: `/app/test_reports/iteration_8.json` - 100% pass rate (18/18 backend, all frontend verified)
