# Natural Plylam Admin Panel - PRD

## Original Problem Statement
1. Import PHP-Admin-Panel-Natural-Plylam GitHub repository
2. Full audit of existing codebase
3. Complete Customer CRUD management
4. Complete Product CRUD management with manual tier pricing
5. Invoice status editing functionality
6. Reusable CRUD architecture with professional components

## Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI (Python) with MongoDB
- **Authentication**: JWT-based authentication
- **Database**: MongoDB (local)

## User Personas
1. **Super Admin** - Full access to all features
2. **Manager** - Can manage orders, customers, invoices, products
3. **Customer** - Can view their orders (future scope)

## Core Requirements (Static)
- [x] User authentication (login/logout)
- [x] Dashboard with KPIs
- [x] Customer management (FULL CRUD)
- [x] Product management (FULL CRUD with tier pricing)
- [x] Order management (list, filter, status updates)
- [x] Invoice management (list, filter, status editing)
- [x] Profile management

## Implemented Features

### Phase 1 - Initial Setup
- FastAPI backend with MongoDB
- React frontend with Vite
- JWT authentication
- Basic admin panel layout

### Phase 2 - Customer CRUD & Reusable Components
- Complete Customer CRUD
- Reusable UI Components (Toast, ConfirmDialog, SlideOver, DataTable)

### Phase 3 - Product CRUD & Invoice Status (March 17, 2026)

#### Product Management
- **List**: View all products with search and category filter
- **Add Product**: Create new products with:
  - Basic Info (name, category, description)
  - Manual Tier Pricing:
    - Tier 1 (Standard) - custom price
    - Tier 2 (Wholesale) - custom price
    - Tier 3 (Premium) - custom price
    - "Auto-calculate from base" button (5% off, 10% off)
  - Stock management (status, quantity)
  - Image URL
- **Edit Product**: Update all fields including tier prices
- **View Details**: Slide-over showing all product info
- **Delete Product**: With confirmation (blocked if used in orders)

#### Invoice Status Editing
- Change invoice status to:
  - Pending
  - Paid
  - Overdue
  - Partially Paid
  - Cancelled
- Quick action buttons (Mark as Paid, Mark as Overdue)
- Status selection modal with visual indicators

### Backend Endpoints Added
```
Products:
- GET    /api/products             - List all products
- GET    /api/products/{id}        - Get single product
- POST   /api/products             - Create product (with tier pricing)
- PUT    /api/products/{id}        - Update product
- DELETE /api/products/{id}        - Delete product

Invoices:
- PUT    /api/invoices/{id}        - Update invoice status
```

### Files Changed
- `/app/backend/server.py` - Product CRUD + Invoice update endpoints
- `/app/frontend/src/pages/Products.tsx` - Full CRUD with tier pricing form
- `/app/frontend/src/pages/InvoiceDetail.tsx` - Status editing UI
- `/app/frontend/src/apiService.ts` - New API methods

## Testing Results
- Backend: 100% pass rate (all CRUD operations verified)
- Frontend: UI loads correctly, all features functional

## Credentials for Testing
- **Admin**: admin@naturalplylam.com / admin123
- **Manager**: manager@naturalplylam.com / manager123

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Customer CRUD
- [x] Product CRUD with manual tier pricing
- [x] Invoice status editing
- [x] Reusable components

### P1 (High)
- [ ] Order creation for admin
- [ ] Invoice generation from orders
- [ ] Customer/Product import from CSV

### P2 (Medium)
- [ ] Reports/analytics dashboard
- [ ] Email notifications
- [ ] Audit log for actions

### P3 (Low)
- [ ] Dark mode
- [ ] Print invoice PDF
- [ ] Bulk actions

## Next Tasks
1. Order creation workflow for admin
2. Invoice generation from completed orders
3. Import customers/products from CSV
