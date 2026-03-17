# Natural Plylam Business Management System - PRD

## Original Problem Statement
1. Import PHP-Admin-Panel-Natural-Plylam GitHub repository
2. Full audit of existing codebase
3. Complete Customer CRUD management
4. Complete Product CRUD management with manual tier pricing
5. Invoice status editing functionality
6. Reusable CRUD architecture with professional components
7. **Customer Portal** - Build a separate customer-facing portal for order management

## Architecture
- **Admin Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (port 3000)
- **Customer Portal**: React 19 + TypeScript + Vite + Tailwind CSS (served at /portal/)
- **Backend**: FastAPI (Python) with MongoDB
- **Authentication**: JWT-based authentication
- **Database**: MongoDB (local)

## User Personas
1. **Super Admin** - Full access to all admin features
2. **Manager** - Can manage orders, customers, invoices, products
3. **Customer** - Can browse products, place orders, view their orders/invoices

## Core Requirements (Static)
- [x] User authentication (login/logout)
- [x] Admin Dashboard with KPIs
- [x] Customer management (FULL CRUD)
- [x] Product management (FULL CRUD with tier pricing)
- [x] Order management (list, filter, status updates)
- [x] Invoice management (list, filter, status editing)
- [x] Profile management
- [x] **Customer Portal** with product catalog, cart, checkout, orders, invoices

## Implemented Features

### Admin Panel
- FastAPI backend with MongoDB
- React frontend with Vite
- JWT authentication
- Professional admin panel layout (desktop-first)
- Complete Customer CRUD with search, filter, activate/deactivate, archive
- Complete Product CRUD with manual tier pricing (Tier 1, 2, 3)
- Order management with status filters
- Invoice status editing (Pending, Paid, Overdue, Partially Paid, Cancelled)
- Reusable UI Components (Toast, ConfirmDialog, SlideOver, DataTable)

### Customer Portal (March 17, 2026)
- Mobile-first design with bottom navigation
- Customer registration with admin approval workflow
- Customer login/logout
- **Dashboard**: Recent orders, total spend, quick actions
- **Products**: Catalog with search, category filters, tier-based pricing
- **Cart**: Add/remove items, quantity adjustment
- **Checkout**: Place orders from cart
- **Orders**: View order history with status tracking
- **Invoices**: View invoices with PDF download
- **Profile**: View/edit customer details

### Backend Endpoints

#### Auth & User
- POST /api/login - Login (supports admin and customer roles)
- POST /api/logout - Logout
- POST /api/register - Customer registration
- GET /api/me - Get current user profile
- POST /api/token/refresh - Refresh JWT token

#### Products
- GET /api/products - List all products
- GET /api/products/{id} - Get single product
- POST /api/products - Create product (with tier pricing)
- PUT /api/products/{id} - Update product
- DELETE /api/products/{id} - Delete product

#### Customers (Admin)
- GET /api/customers - List all customers
- GET /api/customers/{id} - Get customer with orders/invoices
- POST /api/customers - Create customer
- PUT /api/customers/{id} - Update customer
- DELETE /api/customers/{id} - Archive/delete customer

#### Orders
- GET /api/orders - List all orders
- GET /api/customer/orders - List customer's orders (for portal)
- GET /api/customer/orders/{id} - Get customer's order detail

#### Invoices
- GET /api/invoices - List all invoices
- PUT /api/invoices/{id} - Update invoice status
- GET /api/customer/invoices - List customer's invoices (for portal)
- GET /api/customer/invoices/{id} - Get customer's invoice detail

#### Cart & Checkout (Customer Portal)
- GET /api/cart - Get customer's cart
- POST /api/cart - Add/update cart item
- DELETE /api/cart - Clear cart or remove item
- POST /api/checkout - Create order from cart

#### Profile (Customer Portal)
- PATCH /api/customer/profile - Update customer profile
- POST /api/customer/change-password - Change password

## Testing Results (Iteration 5)
- Backend: 95% pass rate (39/41 tests)
- Frontend: 100% - All pages load and function correctly
- Both Admin Panel and Customer Portal verified working

## Credentials for Testing
- **Admin**: admin@naturalplylam.com / admin123
- **Manager**: manager@naturalplylam.com / manager123
- **Customer**: customer1@example.com / customer123

## URLs
- **Admin Panel**: https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/
- **Customer Portal**: https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/portal/

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Customer CRUD
- [x] Product CRUD with manual tier pricing
- [x] Invoice status editing
- [x] Reusable components
- [x] Customer Portal with all features

### P1 (High)
- [ ] Order creation for admin
- [ ] Invoice generation from orders
- [ ] Customer/Product import from CSV
- [ ] Order image upload

### P2 (Medium)
- [ ] Reports/analytics dashboard
- [ ] Email notifications
- [ ] Audit log for actions

### P3 (Low)
- [ ] Dark mode
- [ ] Print invoice PDF from admin
- [ ] Bulk actions

## Next Tasks
1. Order creation workflow for admin
2. Invoice generation from completed orders
3. Import customers/products from CSV
