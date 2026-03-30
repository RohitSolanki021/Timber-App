# Natural Plylam B2B Ordering System - PRD

## Original Problem Statement
Transform the application into a **B2B Plywood/Timber direct ordering system** with:
1. Single-screen fast ordering with cascading dropdowns
2. 6 pricing tiers based on customer type
3. Strict stock validation by product + thickness + size
4. Split billing (separate Plywood and Timber bills)
5. Photo order upload option
6. Order editable until admin confirms
7. Admin dashboard with separate Plywood/Timber sections
8. PDF generation for invoices

## Architecture
- **Admin Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (port 3000)
- **Customer Portal**: `/portal/` - B2B ordering interface
- **Sales Portal**: `/sales/` - Sales team interface
- **Standalone Admin App**: `/app/admin-app-standalone/`
- **Backend**: FastAPI (Python) with MongoDB
- **Authentication**: JWT-based with role-based access

## Implemented Features (March 30, 2026)

### B2B Ordering System (NEW)
- **Fast Order Page**: Horizontal row-based layout matching reference design
  - Product | Thickness | Size | Qty | Amount columns
  - Auto-cascading dropdowns (selecting one opens next)
  - Multiple products per order
  - "+ Add Product" button
  - "Upload Invoice / Photo Order" option
  - Bottom summary: Total Qty | Total Amount
  - "Next" button to submit

- **Split Billing**: One order with mixed items creates 2 separate bills
  - Plywood items → Plywood order/invoice
  - Timber items → Timber order/invoice

- **6 Pricing Tiers**: Customer pricing based on tier (1-6)
  - Each product has `pricing_tiers` object
  - Price auto-calculated based on customer's tier

- **Stock Management**: Stock tracked by product + thickness + size
  - `/api/stock/check` endpoint validates availability
  - Stock deducted on order confirmation

- **Order Edit/Lock**: Orders are editable until admin confirms
  - `is_editable: true` until status = "Confirmed"

### Backend V2 APIs
- `GET /api/product-groups` - Plywood/Timber groups
- `GET /api/products-v2` - Products with variants
- `GET /api/products-v2/{id}/stock` - Stock by variant
- `GET /api/stock/check` - Stock availability check
- `GET /api/price/calculate` - Price calculation by tier
- `POST /api/orders/direct` - Create order (auto-splits)
- `GET /api/orders/v2` - Orders with filters (type, status)
- `PUT /api/orders/v2/{id}` - Update order items
- `POST /api/orders/v2/{id}/confirm` - Confirm order (admin)
- `GET /api/invoices/v2` - Invoices with filters
- `GET /api/invoices/v2/{id}/pdf` - HTML invoice for printing
- `GET /api/admin/dashboard/v2` - Dashboard with split sections

### Role-Based Access Control
- **Super Admin**: Full access + Staff Management
- **Admin (Worker)**: Orders, Products, Customers (view-only)
- **Sales Person**: Place orders for assigned customers
- **Customer**: B2B ordering with tier pricing

## Data Models

### products_v2
```json
{
  "id": "MDF-PP",
  "name": "MDF PP Plain",
  "group": "Plywood",
  "thicknesses": ["3", "5.5", "11", "18"],
  "sizes": ["2.44 x 1.22", "3.05 x 1.22"],
  "pricing_tiers": {"1": 417.45, "2": 400, "3": 385, "4": 370, "5": 355, "6": 340}
}
```

### orders_v2
```json
{
  "id": "ORD-XXXXXXXX",
  "customer_id": 1,
  "order_type": "Plywood|Timber",
  "status": "Pending|Confirmed|Dispatched|Completed|Cancelled",
  "items": [...],
  "total_quantity": 10,
  "sub_total": 4000,
  "cgst": 360,
  "sgst": 360,
  "grand_total": 4720,
  "pricing_tier": "2",
  "is_editable": true
}
```

### stock
```json
{
  "stock_key": "MDF-PP_11_2.44X1.22",
  "product_id": "MDF-PP",
  "thickness": "11",
  "size": "2.44 x 1.22",
  "quantity": 100,
  "reserved": 0
}
```

## URLs
- **Admin Panel**: https://admin-panel-refactor-7.preview.emergentagent.com/
- **Customer Portal**: https://admin-panel-refactor-7.preview.emergentagent.com/portal/
- **Sales Portal**: https://admin-panel-refactor-7.preview.emergentagent.com/sales/

## Test Credentials
- **Super Admin**: admin@naturalplylam.com / admin123
- **Worker Admin**: worker@naturalplylam.com / worker123
- **Customer (Tier 2)**: customer1@example.com / customer123

## Files Modified/Created

### Backend
- `/app/backend/server.py`: Complete V2 API implementation

### Customer Portal
- `/app/customer-portal/src/pages/FastOrder.tsx`: NEW - Horizontal order layout
- `/app/customer-portal/src/pages/Dashboard.tsx`: Updated with Plywood/Timber stats
- `/app/customer-portal/src/pages/Orders.tsx`: Updated with type filter
- `/app/customer-portal/src/pages/Invoices.tsx`: Updated with type filter
- `/app/customer-portal/src/components/Layout.tsx`: Updated navigation
- `/app/customer-portal/src/App.tsx`: Updated routes

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] B2B Fast Order Page (cascading dropdowns)
- [x] Split billing (Plywood/Timber)
- [x] 6 pricing tiers
- [x] Stock validation
- [x] Order edit/lock
- [x] Photo order upload

### P1 (High) - PENDING
- [ ] Admin Dashboard UI update for V2 (separate Plywood/Timber sections)
- [ ] Sales Portal update for V2 APIs
- [ ] Order confirmation flow (admin clicks "Confirm" → locks order → creates invoice)
- [ ] Real PDF generation (currently HTML-based print)

### P2 (Medium)
- [ ] Customer/Product import from CSV
- [ ] Email notifications on order status change
- [ ] Reports/analytics dashboard

### P3 (Low)
- [ ] Dark mode
- [ ] Bulk order upload
- [ ] Audit log for actions

## Next Tasks
1. Update Admin Dashboard UI to show V2 orders (Plywood/Timber sections)
2. Add order confirmation button in admin
3. Update Sales Portal for V2 APIs
4. Implement proper PDF generation using reportlab
