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
- `customers`: {pricing_tier (1-6), approval_status, business_name}

### Key API Endpoints
- `POST /api/orders/direct` - Create split billing order
- `GET /api/orders/v2` - List orders with filters
- `POST /api/orders/v2/{id}/confirm` - Confirm order, create invoice
- `POST /api/orders/v2/{id}/cancel` - Cancel order
- `GET /api/invoices/v2` - List invoices with type filters
- `GET /api/products-v2` - Cascading product variants
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
- [x] Transport details modal

#### Admin Panel
- [x] Orders V2 page with Plywood/Timber type filters
- [x] Confirm/Cancel buttons for pending orders
- [x] Status filters (Pending, Confirmed, Dispatched, Completed, Cancelled)
- [x] Order detail modal view
- [x] 6-tier pricing in Customer create/edit forms
- [x] Invoices V2 page with Plywood/Timber type filters
- [x] Invoice detail page with embedded items
- [x] Mark as Paid/Overdue quick actions

#### Sales Portal
- [x] FastOrder flow with customer selection first
- [x] Add Customer with 6-tier pricing (auto-approved)
- [x] Updated navigation (removed old Cart)
- [x] Dashboard with Create Order link

#### Backend
- [x] Split billing logic (Plywood/Timber separation)
- [x] 6-tier pricing support
- [x] Order confirmation creates invoice
- [x] Stock validation per variant
- [x] Sales customer creation endpoint

### Test Credentials
- Super Admin: admin@naturalplylam.com / admin123
- Worker Admin: worker@naturalplylam.com / worker123
- Sales Person: sales@naturalplylam.com / sales123
- Customer (Tier 2): customer1@example.com / customer123 (MPIN: 1234, Phone: 9876543212)

## Backlog (P1/P2)

### P1 - Important
- [ ] Admin Banner Management UI (backend done, needs Super Admin UI)
- [ ] Transport details validation (mandatory when delivery selected)

### P2 - Future
- [ ] PDF generation with reportlab for invoices
- [ ] CSV import for customers/products
- [ ] Order edit functionality (before confirmation)
- [ ] Product stock bulk update UI

## Test Reports
- Latest: `/app/test_reports/iteration_7.json` - 100% pass rate (21/21 backend, all frontend)
