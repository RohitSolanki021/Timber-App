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
- `customers`: {pricing_tier (1-6), approval_status, business_name}

## Implementation Status

### Completed Features (April 6, 2026)

#### Order Placing - FIXED ✅
- [x] Customer portal can place orders (customer_id derived from token)
- [x] Stock validation works - allows order if stock exists, shows error if insufficient
- [x] Unified orders - single order can contain both Plywood & Timber items
- [x] Next button z-index fixed - no longer blocked by nav

#### Product Page - NEW ✅
- [x] Products list page with search and category filters (All/Plywood/Timber)
- [x] Clickable product cards showing name, description, price, variants count
- [x] Product detail page with:
  - Product image (with placeholder for products without images)
  - Image gallery with thumbnails (if multiple images)
  - Full-screen image modal on click
  - Your Price display (based on customer's tier)
  - Thickness dropdown to select variant
  - Sizes & Stock table showing available stock per variant
  - **"Out of Stock"** indicator in red when stock = 0
  - **Stock quantity** in green when available
  - Pricing by Tier table showing all 6 tier prices
  - Place Order button linking to FastOrder page

#### FastOrder UX
- [x] NO auto-advance - quantity field doesn't auto-add rows when typing
- [x] Enter key to add row - Press Enter in quantity field to add next product row
- [x] "+ Add Product" button persists - always visible for adding more items
- [x] Filter buttons don't reset items - PLYWOOD/TIMBER toggle only filters products
- [x] Mixed orders supported - can add Plywood + Timber items in same order
- [x] Summary bar shows "Estimated" only for Plywood-only orders

#### Business Logic
- [x] GST REMOVED - No CGST/SGST calculations
- [x] Plywood orders do NOT generate invoices - use "Estimated" pricing only
- [x] Status renamed: "Pending" → "Order Placed" in UI
- [x] Order types: Plywood, Timber, or Mixed based on items

### Test Credentials
- Super Admin: admin@naturalplylam.com / admin123
- Sales Person: sales@naturalplylam.com / sales123
- Customer (Tier 2): customer1@example.com / customer123

## Backlog

### P1 - Next
- [ ] WhatsApp sharing for invoices in Sales Portal
- [ ] PDF generation with reportlab for invoice download
- [ ] Add product images upload in Admin

### P2 - Future
- [ ] Admin Banner Management UI
- [ ] Sales Portal: Filter invoices to own customers only
- [ ] CSV import for customers
- [ ] Product stock bulk update UI

## Test Reports
- Latest: `/app/test_reports/iteration_9.json`
