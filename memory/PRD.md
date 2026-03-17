# Natural Plylam Business Management System - PRD

## Original Problem Statement
1. Import PHP-Admin-Panel-Natural-Plylam GitHub repository
2. Full audit of existing codebase
3. Complete Customer CRUD management
4. Complete Product CRUD management with manual tier pricing
5. Invoice status editing functionality
6. Reusable CRUD architecture with professional components
7. **Customer Portal** - Build a separate customer-facing portal for order management
8. **Sales Portal** - Build a sales team portal for managing assigned customers
9. **Standalone Admin App** - Build a new standalone admin app from user's GitHub repo

## Architecture
- **Admin Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (port 3000)
- **Customer Portal**: React 19 + TypeScript + Vite + Tailwind CSS (served at /portal/)
- **Sales Portal**: React 19 + TypeScript + Vite + Tailwind CSS (served at /sales/)
- **Standalone Admin App**: `/app/admin-app-standalone/` - Independent admin app
- **Backend**: FastAPI (Python) with MongoDB
- **Authentication**: JWT-based authentication
- **Database**: MongoDB (local)

## User Personas
1. **Super Admin** - Full access to all admin features
2. **Manager** - Can manage orders, customers, invoices, products
3. **Customer** - Can browse products, place orders, view their orders/invoices
4. **Sales Person** - Can manage assigned customers, place orders on their behalf

## Core Requirements (Static)
- [x] User authentication (login/logout)
- [x] Admin Dashboard with KPIs
- [x] Customer management (FULL CRUD)
- [x] Product management (FULL CRUD with tier pricing)
- [x] Order management (list, filter, status updates)
- [x] Invoice management (list, filter, status editing)
- [x] Profile management
- [x] **Customer Portal** with product catalog, cart, checkout, orders, invoices
- [x] **Sales Portal** with customer management and order placement
- [x] **Standalone Admin App** - Independent admin panel

## Implemented Features

### Admin Panel (Original)
- FastAPI backend with MongoDB
- React frontend with Vite
- JWT authentication
- Professional admin panel layout (desktop-first)
- Complete Customer CRUD with search, filter, activate/deactivate, archive
- Complete Product CRUD with manual tier pricing (Tier 1, 2, 3)
- Order management with status filters
- Invoice status editing

### Customer Portal (March 17, 2026)
- Mobile-first design with bottom navigation
- Customer registration with admin approval workflow
- Customer login/logout
- Product catalog with tier-based pricing
- Cart and checkout functionality
- Order and invoice management

### Sales Portal (March 17, 2026)
- Dashboard with assigned customers stats
- Customer management (view assigned customers only)
- Product catalog with customer-specific pricing
- Order placement on behalf of customers
- Add new customers feature

### Standalone Admin App (March 17, 2026) - COMPLETED
**Location**: `/app/admin-app-standalone/`

**Features Implemented**:
- Desktop-first sidebar layout
- Login page with admin authentication
- Dashboard with real-time KPIs (pending orders, total orders, due invoices, completed)
- Customer management with DataTable, search, filters, and SlideOver forms
- Product management with CRUD operations and tier pricing
- Order management with status workflow visualization
- Invoice management with status updates
- Profile page
- Reusable UI Components:
  - `DataTable.tsx` - Sortable, paginated data tables
  - `SlideOver.tsx` - Side panel forms
  - `Toast.tsx` - Toast notification system
  - `ConfirmDialog.tsx` - Confirmation modals

**Tech Stack**:
- React 19, TypeScript, Vite
- Tailwind CSS v4
- React Router v7
- Motion (Framer Motion)
- Lucide Icons

**Build Status**: ✅ Successfully built

## Credentials for Testing
- **Admin**: admin@naturalplylam.com / admin123
- **Manager**: manager@naturalplylam.com / manager123
- **Customer**: customer1@example.com / customer123
- **Sales Person**: sales1@naturalplylam.com / sales123

## URLs
- **Admin Panel**: https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/
- **Customer Portal**: https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/portal/
- **Sales Portal**: https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/sales/
- **Standalone Admin App (Dev)**: http://localhost:3001

## Standalone Admin App Files
- `/app/admin-app-standalone/README.md` - Documentation
- `/app/admin-app-standalone/.env.example` - Environment template
- `/app/admin-app-standalone/.gitignore` - Git ignore rules
- `/app/admin-app-standalone/package.json` - Dependencies
- `/app/admin-app-standalone/dist/` - Production build

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Customer CRUD
- [x] Product CRUD with manual tier pricing
- [x] Invoice status editing
- [x] Reusable components
- [x] Customer Portal with all features
- [x] Sales Portal implementation
- [x] Standalone Admin App

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
